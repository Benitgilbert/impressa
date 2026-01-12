import SiteSettings from "../models/SiteSettings.js";

/**
 * Get site settings (public - for frontend)
 */
export const getPublicSettings = async (req, res, next) => {
    try {
        const settings = await SiteSettings.getSettings();

        // Filter to only active trust badges and sort by order
        const activeTrustBadges = settings.trustBadges
            .filter(badge => badge.isActive)
            .sort((a, b) => a.order - b.order);

        res.json({
            success: true,
            data: {
                trustBadges: activeTrustBadges,
                siteName: settings.siteName,
                tagline: settings.tagline,
                // Footer data
                footerTagline: settings.footerTagline,
                contactEmail: settings.contactEmail,
                contactPhone: settings.contactPhone,
                contactAddress: settings.contactAddress,
                googleMapsQuery: settings.googleMapsQuery,
                socialLinks: settings.socialLinks || {}
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all site settings (admin)
 */
export const getAllSettings = async (req, res, next) => {
    try {
        const settings = await SiteSettings.getSettings();

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update trust badges
 */
export const updateTrustBadges = async (req, res, next) => {
    try {
        const { trustBadges } = req.body;

        if (!Array.isArray(trustBadges)) {
            const error = new Error("Trust badges must be an array");
            error.statusCode = 400;
            return next(error);
        }

        const settings = await SiteSettings.getSettings();
        settings.trustBadges = trustBadges;
        await settings.save();

        res.json({
            success: true,
            message: "Trust badges updated successfully",
            data: settings.trustBadges
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update general site settings
 */
export const updateGeneralSettings = async (req, res, next) => {
    try {
        const { siteName, tagline, contactEmail, contactPhone } = req.body;

        const settings = await SiteSettings.getSettings();

        if (siteName !== undefined) settings.siteName = siteName;
        if (tagline !== undefined) settings.tagline = tagline;
        if (contactEmail !== undefined) settings.contactEmail = contactEmail;
        if (contactPhone !== undefined) settings.contactPhone = contactPhone;

        await settings.save();

        res.json({
            success: true,
            message: "Settings updated successfully",
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update footer settings
 */
export const updateFooterSettings = async (req, res, next) => {
    try {
        const { footerTagline, contactEmail, contactPhone, contactAddress, googleMapsQuery, socialLinks } = req.body;

        const settings = await SiteSettings.getSettings();

        if (footerTagline !== undefined) settings.footerTagline = footerTagline;
        if (contactEmail !== undefined) settings.contactEmail = contactEmail;
        if (contactPhone !== undefined) settings.contactPhone = contactPhone;
        if (contactAddress !== undefined) settings.contactAddress = contactAddress;
        if (googleMapsQuery !== undefined) settings.googleMapsQuery = googleMapsQuery;
        if (socialLinks !== undefined) {
            settings.socialLinks = {
                facebook: socialLinks.facebook || '',
                twitter: socialLinks.twitter || '',
                instagram: socialLinks.instagram || '',
                linkedin: socialLinks.linkedin || ''
            };
        }

        await settings.save();

        res.json({
            success: true,
            message: "Footer settings updated successfully",
            data: {
                footerTagline: settings.footerTagline,
                contactEmail: settings.contactEmail,
                contactPhone: settings.contactPhone,
                contactAddress: settings.contactAddress,
                googleMapsQuery: settings.googleMapsQuery,
                socialLinks: settings.socialLinks
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset trust badges to default
 */
export const resetTrustBadges = async (req, res, next) => {
    try {
        const settings = await SiteSettings.getSettings();

        settings.trustBadges = [
            { icon: 'truck', title: 'Free Delivery', description: 'On orders over 50,000 Rwf', isActive: true, order: 0 },
            { icon: 'shield', title: 'Secure Payment', description: '100% protected', isActive: true, order: 1 },
            { icon: 'undo', title: 'Easy Returns', description: '30-day policy', isActive: true, order: 2 },
            { icon: 'headset', title: '24/7 Support', description: 'Always here to help', isActive: true, order: 3 }
        ];

        await settings.save();

        res.json({
            success: true,
            message: "Trust badges reset to defaults",
            data: settings.trustBadges
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update seller auto-approval settings
 */
export const updateSellerAutoApproval = async (req, res, next) => {
    try {
        const { enabled, minScore, criteria } = req.body;

        const settings = await SiteSettings.getSettings();

        if (enabled !== undefined) {
            settings.sellerAutoApproval.enabled = enabled;
        }
        if (minScore !== undefined) {
            settings.sellerAutoApproval.minScore = Math.max(0, Math.min(100, minScore));
        }
        if (criteria) {
            settings.sellerAutoApproval.criteria = {
                ...settings.sellerAutoApproval.criteria,
                ...criteria
            };
        }

        await settings.save();

        res.json({
            success: true,
            message: "Seller auto-approval settings updated",
            data: settings.sellerAutoApproval
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update payout settings
 */
export const updatePayoutSettings = async (req, res, next) => {
    try {
        const { autoPayoutEnabled, frequency, minimumAmount, payoutDay, maxAutoPayoutAmount } = req.body;

        const settings = await SiteSettings.getSettings();

        if (autoPayoutEnabled !== undefined) {
            settings.payoutSettings.autoPayoutEnabled = autoPayoutEnabled;
        }
        if (frequency !== undefined) {
            settings.payoutSettings.frequency = frequency;
        }
        if (minimumAmount !== undefined) {
            settings.payoutSettings.minimumAmount = Math.max(0, minimumAmount);
        }
        if (payoutDay !== undefined) {
            settings.payoutSettings.payoutDay = Math.max(1, Math.min(7, payoutDay));
        }
        if (maxAutoPayoutAmount !== undefined) {
            settings.payoutSettings.maxAutoPayoutAmount = Math.max(0, maxAutoPayoutAmount);
        }

        await settings.save();

        res.json({
            success: true,
            message: "Payout settings updated",
            data: settings.payoutSettings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update commission rate
 */
export const updateCommissionRate = async (req, res, next) => {
    try {
        const { commissionRate } = req.body;

        if (commissionRate === undefined || commissionRate < 0 || commissionRate > 100) {
            return res.status(400).json({
                success: false,
                message: "Commission rate must be between 0 and 100"
            });
        }

        const settings = await SiteSettings.getSettings();
        settings.commissionRate = commissionRate;
        await settings.save();

        res.json({
            success: true,
            message: "Commission rate updated",
            data: { commissionRate: settings.commissionRate }
        });
    } catch (error) {
        next(error);
    }
};

