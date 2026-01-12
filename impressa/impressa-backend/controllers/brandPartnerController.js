import BrandPartner from "../models/BrandPartner.js";

/**
 * Get all brand partners (admin)
 */
export const getAllBrandPartners = async (req, res, next) => {
    try {
        const partners = await BrandPartner.find().sort({ order: 1, createdAt: -1 });

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
 * Get active brand partners for public display
 */
export const getActiveBrandPartners = async (req, res, next) => {
    try {
        const partners = await BrandPartner.getActivePartners();

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
 * Get single brand partner by ID
 */
export const getBrandPartnerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const partner = await BrandPartner.findById(id);

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
 * Create new brand partner
 */
export const createBrandPartner = async (req, res, next) => {
    try {
        const { name, websiteUrl, isActive, order, logo: logoUrl } = req.body;

        let logo = logoUrl;
        if (req.file) {
            logo = req.file.path;
        }

        const partner = await BrandPartner.create({
            name,
            logo: logo || null,
            websiteUrl: websiteUrl || null,
            isActive: isActive !== "false", // FormData sends boolean as string sometimes
            order: order || 0
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
 * Update brand partner
 */
export const updateBrandPartner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        if (req.file) {
            updates.logo = req.file.path;
        }

        // Handle boolean conversion from FormData
        if (updates.isActive) {
            updates.isActive = updates.isActive === "true" || updates.isActive === true;
        }

        const partner = await BrandPartner.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!partner) {
            const error = new Error("Brand partner not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            message: "Brand partner updated successfully",
            data: partner
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete brand partner
 */
export const deleteBrandPartner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const partner = await BrandPartner.findByIdAndDelete(id);

        if (!partner) {
            const error = new Error("Brand partner not found");
            error.statusCode = 404;
            return next(error);
        }

        res.json({
            success: true,
            message: "Brand partner deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder brand partners
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
            BrandPartner.findByIdAndUpdate(id, { order })
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
 * Toggle brand partner active status
 */
export const toggleBrandPartnerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const partner = await BrandPartner.findById(id);

        if (!partner) {
            const error = new Error("Brand partner not found");
            error.statusCode = 404;
            return next(error);
        }

        partner.isActive = !partner.isActive;
        await partner.save();

        res.json({
            success: true,
            message: `Brand partner ${partner.isActive ? "activated" : "deactivated"} successfully`,
            data: partner
        });
    } catch (error) {
        next(error);
    }
};
