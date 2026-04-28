import prisma from "../prisma.js";
import { notifyFlashSaleCreated } from "./notificationController.js";

/**
 * Get all flash sales
 */
export const getAllFlashSales = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status === "active") {
            const now = new Date();
            query = {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            };
        } else if (status === "upcoming") {
            const now = new Date();
            query = {
                isActive: true,
                startDate: { gt: now }
            };
        } else if (status === "ended") {
            const now = new Date();
            query = {
                endDate: { lt: now }
            };
        }

        const flashSales = await prisma.flashSale.findMany({
            where: query,
            include: {
                products: {
                    include: { product: { select: { name: true, price: true, images: true } } }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        res.json({
            success: true,
            count: flashSales.length,
            data: flashSales
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get currently active flash sales with products
 */
export const getActiveFlashSales = async (req, res, next) => {
    try {
        const now = new Date();
        const flashSales = await prisma.flashSale.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            },
            include: {
                products: {
                    where: { product: { visibility: "public", approvalStatus: "approved" } },
                    include: {
                        product: {
                            select: { id: true, name: true, price: true, image: true, images: true, stock: true, description: true }
                        }
                    }
                }
            }
        });

        // Format response with product details
        const formattedSales = flashSales.map((sale) => {
            // Calculate time remaining in ms to mimic Mongoose virtual
            const timeRemaining = sale.endDate.getTime() - now.getTime();

            return {
                _id: sale.id,
                name: sale.name,
                description: sale.description,
                startDate: sale.startDate,
                endDate: sale.endDate,
                bannerImage: sale.bannerImage,
                bannerColor: sale.bannerColor,
                timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
                products: sale.products.map((sp) => ({
                    _id: sp.product?.id,
                    name: sp.product?.name,
                    originalPrice: sp.product?.price,
                    flashSalePrice: sp.flashSalePrice,
                    discount: sp.product?.price
                        ? Math.round(((sp.product.price - sp.flashSalePrice) / sp.product.price) * 100)
                        : 0,
                    images: sp.product?.images,
                    image: sp.product?.image,
                    stockLimit: sp.stockLimit,
                    soldCount: sp.soldCount,
                    remaining: sp.stockLimit ? sp.stockLimit - sp.soldCount : null,
                    isAvailable: sp.stockLimit === null || sp.soldCount < sp.stockLimit
                })).filter(p => p._id) // Filter out products that may have been deleted
            };
        });

        res.json({
            success: true,
            count: formattedSales.length,
            data: formattedSales
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single flash sale by ID
 */
export const getFlashSaleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const flashSale = await prisma.flashSale.findUnique({
            where: { id },
            include: {
                products: {
                    where: { product: { visibility: "public", approvalStatus: "approved" } },
                    include: {
                        product: {
                            select: { name: true, price: true, images: true, stock: true }
                        }
                    }
                }
            }
        });

        if (!flashSale) {
            const error = new Error("Flash sale not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            data: flashSale
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new flash sale
 */
export const createFlashSale = async (req, res, next) => {
    try {
        const {
            name,
            description,
            startDate,
            endDate,
            products,
            bannerImage,
            bannerColor,
            isActive
        } = req.body;

        // Validate products exist
        if (products && products.length > 0) {
            const productIds = products.map((p) => p.product);
            const existingProducts = await prisma.product.count({
                where: { id: { in: productIds } }
            });

            if (existingProducts !== productIds.length) {
                const error = new Error("One or more products not found");
                error.statusCode = 400;
                return next(error);
            }
        }

        const flashSale = await prisma.flashSale.create({
            data: {
                name,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                bannerImage,
                bannerColor,
                isActive: isActive !== false,
                ...(products && products.length > 0 && {
                    products: {
                        create: products.map(p => ({
                            productId: p.product,
                            flashSalePrice: p.flashSalePrice,
                            stockLimit: p.stockLimit || null
                        }))
                    }
                })
            },
            include: { products: true }
        });

        // 🔔 Notify Admin
        try {
            notifyFlashSaleCreated({
                name: flashSale.name,
                status: 'Created',
                recipientId: req.user.id
            });
        } catch (e) { }

        res.status(201).json({
            success: true,
            message: "Flash sale created successfully",
            data: flashSale
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update flash sale
 */
export const updateFlashSale = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        if (updates.startDate) updates.startDate = new Date(updates.startDate);
        if (updates.endDate) updates.endDate = new Date(updates.endDate);

        // Remove products from updates if passed, since it requires nested logic
        delete updates.products;

        const flashSale = await prisma.flashSale.update({
            where: { id },
            data: updates
        });

        res.json({
            success: true,
            message: "Flash sale updated successfully",
            data: flashSale
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Flash sale not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * Delete flash sale
 */
export const deleteFlashSale = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.flashSale.delete({ where: { id } });

        res.json({
            success: true,
            message: "Flash sale deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Flash sale not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * Add product to flash sale
 */
export const addProductToSale = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { productId, flashSalePrice, stockLimit } = req.body;

        // Validate product exists
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            return next(error);
        }

        const flashSale = await prisma.flashSale.findUnique({ where: { id } });
        if (!flashSale) {
            const error = new Error("Flash sale not found");
            error.statusCode = 404;
            return next(error);
        }

        // Check if product already in sale
        const existingProduct = await prisma.flashSaleProduct.findFirst({
            where: { flashSaleId: id, productId }
        });

        if (existingProduct) {
            const error = new Error("Product already in this flash sale");
            error.statusCode = 400;
            return next(error);
        }

        const flashSaleProduct = await prisma.flashSaleProduct.create({
            data: {
                flashSaleId: id,
                productId,
                flashSalePrice,
                stockLimit: stockLimit || null,
                soldCount: 0
            }
        });

        res.json({
            success: true,
            message: "Product added to flash sale",
            data: flashSaleProduct
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove product from flash sale
 */
export const removeProductFromSale = async (req, res, next) => {
    try {
        const { id, productId } = req.params;

        const flashSale = await prisma.flashSale.findUnique({ where: { id } });
        if (!flashSale) {
            const error = new Error("Flash sale not found");
            error.statusCode = 404;
            return next(error);
        }

        await prisma.flashSaleProduct.deleteMany({
            where: { flashSaleId: id, productId }
        });

        res.json({
            success: true,
            message: "Product removed from flash sale"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get flash sale price for a product (for cart/checkout)
 */
export const getFlashSalePriceForProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const now = new Date();

        const flashSale = await prisma.flashSale.findFirst({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
                products: { some: { productId } }
            },
            include: {
                products: { where: { productId } }
            }
        });

        if (!flashSale || !flashSale.products.length) {
            return res.json({
                success: true,
                inFlashSale: false,
                data: null
            });
        }

        const saleProduct = flashSale.products[0];

        res.json({
            success: true,
            inFlashSale: true,
            data: {
                flashSaleId: flashSale.id,
                flashSaleName: flashSale.name,
                flashSalePrice: saleProduct.flashSalePrice,
                stockLimit: saleProduct.stockLimit,
                soldCount: saleProduct.soldCount,
                remaining: saleProduct.stockLimit
                    ? saleProduct.stockLimit - saleProduct.soldCount
                    : null,
                isAvailable:
                    saleProduct.stockLimit === null ||
                    saleProduct.soldCount < saleProduct.stockLimit,
                endsAt: flashSale.endDate
            }
        });
    } catch (error) {
        next(error);
    }
};
