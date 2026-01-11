import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { notifyReviewCreated } from "./notificationController.js";

// Add a review
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user.id,
        });

        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this product" });
        }

        const review = new Review({
            product: productId,
            user: req.user.id,
            rating: Number(rating),
            comment,
        });

        await review.save();

        // 🔔 Notify Admin
        try {
            notifyReviewCreated(product.name, rating);
        } catch (e) { }

        res.status(201).json(review);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get reviews for a product
export const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id })
            .populate("user", "name")
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update review (Customer own review)
export const updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ message: "Review not found" });

        // Verify ownership
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this review" });
        }

        const { rating, comment } = req.body;
        if (rating) review.rating = Number(rating);
        if (comment) review.comment = comment;

        await review.save();
        res.json(review);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete review (Customer own or Admin)
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ message: "Review not found" });

        // Verify ownership or admin
        if (req.user.role !== "admin" && review.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this review" });
        }

        await review.deleteOne();
        res.json({ message: "Review deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
