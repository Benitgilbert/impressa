import prisma from "../prisma.js";
import { notifyReviewCreated } from "./notificationController.js";

/**
 * ⭐ Add a review
 */
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;

        const product = await prisma.product.findUnique({ 
            where: { id: productId } 
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if user already reviewed
        const existingReview = await prisma.review.findFirst({
            where: {
                productId: productId,
                userId: req.user.id,
            }
        });

        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this product" });
        }

        const review = await prisma.review.create({
            data: {
                productId: productId,
                userId: req.user.id,
                rating: Number(rating),
                comment,
            }
        });

        // 🚨 Automatic Violation Trigger: Low Rating
        if (Number(rating) <= 2) {
            try {
                await prisma.violation.create({
                    data: {
                        sellerId: product.sellerId,
                        type: 'low_rating',
                        severity: Number(rating) === 1 ? 'high' : 'medium',
                        status: 'active',
                        penaltyPoints: Number(rating) === 1 ? 5 : 2,
                        description: `Received a ${rating}-star review on product "${product.name}"`,
                        metrics: { currentValue: Number(rating), threshold: 3 }
                    }
                });
            } catch (err) {
                console.error("Failed to auto-create violation:", err);
            }
        }

        // 🔔 Notify Admin
        try {
            notifyReviewCreated(product.name, rating);
        } catch (e) { }

        res.status(201).json(review);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

/**
 * ⭐ Get reviews for a product
 */
export const getProductReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { productId: req.params.id },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * ⭐ Update review (Customer own review)
 */
export const updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const reviewId = req.params.reviewId;

        const review = await prisma.review.findUnique({ 
            where: { id: reviewId } 
        });
        if (!review) return res.status(404).json({ message: "Review not found" });

        // Verify ownership
        if (review.userId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this review" });
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating: rating ? Number(rating) : undefined,
                comment: comment || undefined
            }
        });

        res.json(updatedReview);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

/**
 * ⭐ Delete review (Customer own or Admin)
 */
export const deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;

        const review = await prisma.review.findUnique({ 
            where: { id: reviewId } 
        });
        if (!review) return res.status(404).json({ message: "Review not found" });

        // Verify ownership or admin
        if (req.user.role !== "admin" && review.userId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this review" });
        }

        await prisma.review.delete({
            where: { id: reviewId }
        });

        res.json({ message: "Review deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
