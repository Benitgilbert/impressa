import prisma from "../prisma.js";

/**
 * ✅ Get pending products for approval (admin)
 */
export const getPendingProducts = async (req, res, next) => {
    try {
        const { status = 'pending', page = 1, limit = 20, search } = req.query;

        const where = {};
        if (status !== 'all') {
            where.approvalStatus = status === 'pending' ? 'pending' : status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [products, total, stats] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    seller: { select: { name: true, email: true, storeName: true } },
                    categories: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.product.count({ where }),
            prisma.product.groupBy({
                by: ['approvalStatus'],
                _count: true
            })
        ]);

        const statCounts = { pending: 0, approved: 0, rejected: 0 };
        stats.forEach(s => {
            if (s.approvalStatus === 'pending') statCounts.pending = s._count;
            if (s.approvalStatus === 'approved') statCounts.approved = s._count;
            if (s.approvalStatus === 'rejected') statCounts.rejected = s._count;
        });

        res.json({
            success: true,
            data: products,
            stats: statCounts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Get single product for review (admin)
 */
export const getProductForReview = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                seller: { select: { name: true, email: true, storeName: true, storePhone: true } },
                categories: { select: { name: true } }
            }
        });

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Approve product (admin)
 */
export const approveProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                approvalStatus: 'approved',
                approvalNote: note || '',
                approvedBy: req.user.id,
                approvedAt: new Date(),
                visibility: 'public'
            }
        });

        res.json({
            success: true,
            message: "Product approved successfully",
            data: { id: product.id, name: product.name, approvalStatus: product.approvalStatus }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Reject product (admin)
 */
export const rejectProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: "Rejection reason is required" });
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                approvalStatus: 'rejected',
                approvalNote: reason,
                approvedBy: req.user.id,
                approvedAt: new Date(),
                visibility: 'hidden'
            }
        });

        res.json({
            success: true,
            message: "Product rejected",
            data: { id: product.id, name: product.name, approvalStatus: product.approvalStatus }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Bulk approve products (admin)
 */
export const bulkApproveProducts = async (req, res, next) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !productIds.length) {
            return res.status(400).json({ success: false, message: "No products specified" });
        }

        const result = await prisma.product.updateMany({
            where: { id: { in: productIds }, approvalStatus: 'pending' },
            data: {
                approvalStatus: 'approved',
                visibility: 'public',
                approvedBy: req.user.id,
                approvedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: `${result.count} products approved`,
            count: result.count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Bulk reject products (admin)
 */
export const bulkRejectProducts = async (req, res, next) => {
    try {
        const { productIds, reason } = req.body;

        if (!productIds || !productIds.length) {
            return res.status(400).json({ success: false, message: "No products specified" });
        }

        if (!reason) {
            return res.status(400).json({ success: false, message: "Rejection reason is required" });
        }

        const result = await prisma.product.updateMany({
            where: { id: { in: productIds }, approvalStatus: 'pending' },
            data: {
                approvalStatus: 'rejected',
                visibility: 'hidden',
                approvalNote: reason,
                approvedBy: req.user.id,
                approvedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: `${result.count} products rejected`,
            count: result.count
        });
    } catch (error) {
        next(error);
    }
};
