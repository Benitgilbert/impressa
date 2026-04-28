import prisma from "../prisma.js";

/**
 * Get all banners (admin)
 */
export const getAllBanners = async (req, res, next) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get active banners for public display
 */
export const getActiveBanners = async (req, res, next) => {
    try {
        const { position } = req.query;
        const now = new Date();

        const where = {
            isActive: true,
            OR: [
                { startDate: null },
                { startDate: { lte: now } }
            ],
            AND: [
                { OR: [{ endDate: null }, { endDate: { gte: now } }] }
            ]
        };

        if (position) {
            where.position = position;
        }

        const banners = await prisma.banner.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        res.json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single banner by ID
 */
export const getBannerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const banner = await prisma.banner.findUnique({ where: { id } });

        if (!banner) {
            const error = new Error("Banner not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new banner
 */
export const createBanner = async (req, res, next) => {
    try {
        const {
            title,
            subtitle,
            badge,
            buttonText,
            buttonLink,
            backgroundImage,
            gradientFrom,
            gradientTo,
            startDate,
            endDate,
            isActive,
            order,
            position
        } = req.body;

        const banner = await prisma.banner.create({
            data: {
                title,
                subtitle,
                badge: badge || "Limited Time Offer",
                buttonText: buttonText || "Shop Now",
                buttonLink: buttonLink || "/shop",
                backgroundImage,
                gradientFrom: gradientFrom || "#8b5cf6",
                gradientTo: gradientTo || "#d946ef",
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isActive: isActive !== false,
                order: order || 0,
                position: position || "hero"
            }
        });

        res.status(201).json({
            success: true,
            message: "Banner created successfully",
            data: banner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update banner
 */
export const updateBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Convert dates
        if (updates.startDate) updates.startDate = new Date(updates.startDate);
        if (updates.endDate) updates.endDate = new Date(updates.endDate);

        const banner = await prisma.banner.update({
            where: { id },
            data: updates
        });

        res.json({
            success: true,
            message: "Banner updated successfully",
            data: banner
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Banner not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * Delete banner
 */
export const deleteBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.banner.delete({ where: { id } });

        res.json({
            success: true,
            message: "Banner deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Banner not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * Reorder banners
 */
export const reorderBanners = async (req, res, next) => {
    try {
        const { banners } = req.body; // Array of { id, order }

        if (!Array.isArray(banners)) {
            const error = new Error("Invalid banners array");
            error.statusCode = 400;
            return next(error);
        }

        const updatePromises = banners.map(({ id, order }) =>
            prisma.banner.update({
                where: { id },
                data: { order }
            })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: "Banners reordered successfully"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle banner active status
 */
export const toggleBannerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const banner = await prisma.banner.findUnique({ where: { id } });

        if (!banner) {
            const error = new Error("Banner not found");
            error.statusCode = 404;
            return next(error);
        }

        const updatedBanner = await prisma.banner.update({
            where: { id },
            data: { isActive: !banner.isActive }
        });

        res.json({
            success: true,
            message: `Banner ${updatedBanner.isActive ? "activated" : "deactivated"} successfully`,
            data: updatedBanner
        });
    } catch (error) {
        next(error);
    }
};
