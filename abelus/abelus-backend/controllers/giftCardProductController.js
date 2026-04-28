import prisma from "../prisma.js";
import logger from "../config/logger.js";

/**
 * ✅ Get all active gift card products (Public)
 */
export const getActiveProducts = async (req, res, next) => {
    try {
        const products = await prisma.giftCardProduct.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });

        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Get all gift card products (Admin)
 */
export const getAllProducts = async (req, res, next) => {
    try {
        const products = await prisma.giftCardProduct.findMany({
            orderBy: { order: 'asc' }
        });

        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Create gift card product (Admin)
 */
export const createProduct = async (req, res, next) => {
    try {
        const { label, amount, color, isCustom, isActive, expiryDays } = req.body;

        const maxOrderProduct = await prisma.giftCardProduct.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true }
        });
        const newOrder = maxOrderProduct ? maxOrderProduct.order + 1 : 0;

        const product = await prisma.giftCardProduct.create({
            data: {
                label,
                amount: amount || 0,
                color: color || "from-violet-500 to-indigo-600",
                isCustom: isCustom || false,
                isActive: isActive !== false,
                expiryDays: expiryDays || 365,
                order: newOrder,
            }
        });

        logger.info({ label, amount }, "Gift Card Product Created");
        res.status(201).json({ success: true, message: "Gift Card Product created successfully", data: product });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Update gift card product (Admin)
 */
export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { label, amount, color, isCustom, isActive, order, expiryDays } = req.body;

        const product = await prisma.giftCardProduct.update({
            where: { id },
            data: {
                label,
                amount,
                color,
                isCustom,
                isActive,
                order,
                expiryDays
            }
        });

        logger.info({ id, changes: req.body }, "Gift Card Product Updated");
        res.json({ success: true, message: "Gift Card Product updated successfully", data: product });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Delete gift card product (Admin)
 */
export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.giftCardProduct.delete({ where: { id } });

        logger.info({ id }, "Gift Card Product Deleted");
        res.json({ success: true, message: "Gift Card Product deleted successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Reorder gift card products (Admin)
 */
export const reorderProducts = async (req, res, next) => {
    try {
        const { orderedIds } = req.body;

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, message: "orderedIds must be an array" });
        }

        // Batch update using transaction
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.giftCardProduct.update({
                    where: { id },
                    data: { order: index }
                })
            )
        );

        logger.info({ count: orderedIds.length }, "Gift Card Products Reordered");
        res.json({ success: true, message: "Products reordered successfully" });
    } catch (error) {
        next(error);
    }
};
