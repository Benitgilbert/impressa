import FlashSale from "../models/FlashSale.js";
import Product from "../models/Product.js";
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
                startDate: { $lte: now },
                endDate: { $gte: now }
            };
        } else if (status === "upcoming") {
            const now = new Date();
            query = {
                isActive: true,
                startDate: { $gt: now }
            };
        } else if (status === "ended") {
            const now = new Date();
            query = {
                endDate: { $lt: now }
            };
        }

        const flashSales = await FlashSale.find(query)
            .populate("products.product", "name price images")
            .sort({ startDate: -1 });

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
        const flashSales = await FlashSale.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).populate({
            path: "products.product",
            select: "name price compareAtPrice images stock description"
        });

        // Format response with product details
        const formattedSales = flashSales.map((sale) => ({
            _id: sale._id,
            name: sale.name,
            description: sale.description,
            startDate: sale.startDate,
            endDate: sale.endDate,
            bannerImage: sale.bannerImage,
            bannerColor: sale.bannerColor,
            timeRemaining: sale.timeRemaining,
            products: sale.products.map((sp) => ({
                _id: sp.product?._id,
                name: sp.product?.name,
                originalPrice: sp.product?.price,
                flashSalePrice: sp.flashSalePrice,
                discount: sp.product?.price
                    ? Math.round(((sp.product.price - sp.flashSalePrice) / sp.product.price) * 100)
                    : 0,
                images: sp.product?.images,
                stockLimit: sp.stockLimit,
                soldCount: sp.soldCount,
                remaining: sp.stockLimit ? sp.stockLimit - sp.soldCount : null,
                isAvailable: sp.stockLimit === null || sp.soldCount < sp.stockLimit
            })).filter(p => p._id) // Filter out products that may have been deleted
        }));

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

        const flashSale = await FlashSale.findById(id).populate({
            path: "products.product",
            select: "name price compareAtPrice images stock"
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
            const existingProducts = await Product.find({ _id: { $in: productIds } });

            if (existingProducts.length !== productIds.length) {
                const error = new Error("One or more products not found");
                error.statusCode = 400;
                return next(error);
            }
        }

        const flashSale = await FlashSale.create({
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            products: products || [],
            bannerImage,
            bannerColor,
            isActive: isActive !== false
        });

        // 🔔 Notify Admin
        try {
            notifyFlashSaleCreated({
                name: flashSale.name,
                status: 'Created',
                recipientId: req.user._id // Although internal, good for logging? Or notify OTHER admins? 
                // Wait, notifyAdmins ignores recipientId and broadcasts.
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
        const updates = req.body;

        if (updates.startDate) {
            updates.startDate = new Date(updates.startDate);
        }
        if (updates.endDate) {
            updates.endDate = new Date(updates.endDate);
        }

        const flashSale = await FlashSale.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!flashSale) {
            const error = new Error("Flash sale not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            message: "Flash sale updated successfully",
            data: flashSale
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete flash sale
 */
export const deleteFlashSale = async (req, res, next) => {
    try {
        const { id } = req.params;

        const flashSale = await FlashSale.findByIdAndDelete(id);

        if (!flashSale) {
            const error = new Error("Flash sale not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            message: "Flash sale deleted successfully"
        });
    } catch (error) {
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
        const product = await Product.findById(productId);
        if (!product) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            return next(error);
        }

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) {
            const error = new Error("Flash sale not found");
            error.statusCode = 404;
            return next(error);
        }

        // Check if product already in sale
        const existingProduct = flashSale.products.find(
            (p) => p.product.toString() === productId
        );
        if (existingProduct) {
            const error = new Error("Product already in this flash sale");
            error.statusCode = 400;
            return next(error);
        }

        flashSale.products.push({
            product: productId,
            flashSalePrice,
            stockLimit: stockLimit || null,
            soldCount: 0
        });

        await flashSale.save();

        res.json({
            success: true,
            message: "Product added to flash sale",
            data: flashSale
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

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) {
            const error = new Error("Flash sale not found");
            error.statusCode = 404;
            return next(error);
        }

        flashSale.products = flashSale.products.filter(
            (p) => p.product.toString() !== productId
        );

        await flashSale.save();

        res.json({
            success: true,
            message: "Product removed from flash sale",
            data: flashSale
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

        const flashSale = await FlashSale.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            "products.product": productId
        });

        if (!flashSale) {
            return res.json({
                success: true,
                inFlashSale: false,
                data: null
            });
        }

        const saleProduct = flashSale.products.find(
            (p) => p.product.toString() === productId
        );

        res.json({
            success: true,
            inFlashSale: true,
            data: {
                flashSaleId: flashSale._id,
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
