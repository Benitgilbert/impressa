import prisma from "../prisma.js";

/**
 * 🤝 Get all brand partners (admin)
 */
export const getAllBrandPartners = async (req, res, next) => {
    try {
        const partners = await prisma.brandPartner.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
        });

        res.json({
            success: true,
            count: partners.length,
            data: partners
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🤝 Get active brand partners for public display
 */
export const getActiveBrandPartners = async (req, res, next) => {
    try {
        const partners = await prisma.brandPartner.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });

        res.json({
            success: true,
            count: partners.length,
            data: partners
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🤝 Get single brand partner by ID
 */
export const getBrandPartnerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const partner = await prisma.brandPartner.findUnique({
            where: { id }
        });

        if (!partner) {
            const error = new Error("Brand partner not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            data: partner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🤝 Create new brand partner
 */
export const createBrandPartner = async (req, res, next) => {
    try {
        const { name, websiteUrl, isActive, order, logo: logoUrl } = req.body;

        let logo = logoUrl;
        if (req.file) {
            logo = req.file.path;
        }

        const partner = await prisma.brandPartner.create({
            data: {
                name,
                logo: logo || "",
                websiteUrl: websiteUrl || null,
                isActive: isActive !== "false" && isActive !== false,
                order: order ? parseInt(order) : 0
            }
        });

        res.status(201).json({
            success: true,
            message: "Brand partner created successfully",
            data: partner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🤝 Update brand partner
 */
export const updateBrandPartner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        if (req.file) {
            updates.logo = req.file.path;
        }

        if (updates.isActive !== undefined) {
            updates.isActive = updates.isActive === "true" || updates.isActive === true;
        }
        if (updates.order !== undefined) {
            updates.order = parseInt(updates.order);
        }

        const partner = await prisma.brandPartner.update({
            where: { id },
            data: updates
        });

        res.json({
            success: true,
            message: "Brand partner updated successfully",
            data: partner
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Brand partner not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * 🤝 Delete brand partner
 */
export const deleteBrandPartner = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.brandPartner.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: "Brand partner deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            const err = new Error("Brand partner not found");
            err.statusCode = 404;
            return next(err);
        }
        next(error);
    }
};

/**
 * 🤝 Reorder brand partners
 */
export const reorderBrandPartners = async (req, res, next) => {
    try {
        const { partners } = req.body; // Array of { id, order }

        if (!Array.isArray(partners)) {
            const error = new Error("Invalid partners array");
            error.statusCode = 400;
            return next(error);
        }

        const updatePromises = partners.map(({ id, order }) =>
            prisma.brandPartner.update({
                where: { id },
                data: { order }
            })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: "Brand partners reordered successfully"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🤝 Toggle brand partner active status
 */
export const toggleBrandPartnerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const current = await prisma.brandPartner.findUnique({ where: { id } });

        if (!current) {
            const error = new Error("Brand partner not found");
            error.statusCode = 404;
            return next(error);
        }

        const partner = await prisma.brandPartner.update({
            where: { id },
            data: { isActive: !current.isActive }
        });

        res.json({
            success: true,
            message: `Brand partner ${partner.isActive ? "activated" : "deactivated"} successfully`,
            data: partner
        });
    } catch (error) {
        next(error);
    }
};
