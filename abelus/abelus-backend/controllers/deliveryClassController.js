import prisma from "../prisma.js";
import slugify from "slugify";

/**
 * 🚚 Get all delivery classes
 */
export const getDeliveryClasses = async (req, res, next) => {
    try {
        const classes = await prisma.shippingClass.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: classes });
    } catch (error) {
        next(error);
    }
};

/**
 * 🚚 Create delivery class
 */
export const createDeliveryClass = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        const shippingClass = await prisma.shippingClass.create({
            data: {
                name,
                slug,
                description,
            }
        });

        res.status(201).json({ success: true, data: shippingClass });
    } catch (error) {
        next(error);
    }
};

/**
 * 🚚 Update delivery class
 */
export const updateDeliveryClass = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const updateData = { name, description };

        if (name) {
            updateData.slug = slugify(name, { lower: true, strict: true });
        }

        const shippingClass = await prisma.shippingClass.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json({ success: true, data: shippingClass });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Delivery Class not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * 🚚 Delete delivery class
 */
export const deleteDeliveryClass = async (req, res, next) => {
    try {
        await prisma.shippingClass.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true, message: "Shipping Class deleted" });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Shipping Class not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};
