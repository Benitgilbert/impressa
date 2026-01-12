import mongoose from "mongoose";

const trustBadgeSchema = new mongoose.Schema({
    icon: {
        type: String,
        required: true,
        enum: ['truck', 'shield', 'undo', 'headset', 'clock', 'star', 'check', 'heart'],
        default: 'check'
    },
    title: {
        type: String,
        required: true,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        maxlength: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
});

const siteSettingsSchema = new mongoose.Schema(
    {
        // Trust Badges Section
        trustBadges: {
            type: [trustBadgeSchema],
            default: [
                { icon: 'truck', title: 'Free Delivery', description: 'On orders over 50,000 Rwf', isActive: true, order: 0 },
                { icon: 'shield', title: 'Secure Payment', description: '100% protected', isActive: true, order: 1 },
                { icon: 'undo', title: 'Easy Returns', description: '30-day policy', isActive: true, order: 2 },
                { icon: 'headset', title: '24/7 Support', description: 'Always here to help', isActive: true, order: 3 }
            ]
        },

        // General Site Info
        siteName: {
            type: String,
            default: 'Impressa'
        },
        tagline: {
            type: String,
            default: 'Premium Marketplace'
        },

        // Footer Settings
        footerTagline: {
            type: String,
            default: 'Your premium destination for quality products. Curated collections, exclusive deals, and exceptional service.'
        },
        contactEmail: {
            type: String,
            default: 'support@impressa.com'
        },
        contactPhone: {
            type: String,
            default: '1-800-IMPRESSA'
        },
        contactAddress: {
            type: String,
            default: '123 Commerce Street, Design City, DC 12345'
        },
        googleMapsQuery: {
            type: String,
            default: '1°34\'49.5"S 30°04\'07.7"E'
        },

        // Social Media Links
        socialLinks: {
            facebook: { type: String, default: '' },
            twitter: { type: String, default: '' },
            instagram: { type: String, default: '' },
            linkedin: { type: String, default: '' }
        },

        // Seller Auto-Approval Settings
        sellerAutoApproval: {
            enabled: { type: Boolean, default: false },
            minScore: { type: Number, default: 80 },
            criteria: {
                emailVerified: { type: Number, default: 30 },
                phoneProvided: { type: Number, default: 20 },
                storeNameSet: { type: Number, default: 20 },
                storeDescriptionSet: { type: Number, default: 15 },
                profilePhotoSet: { type: Number, default: 15 }
            }
        },

        // Payout Settings
        payoutSettings: {
            autoPayoutEnabled: { type: Boolean, default: false },
            frequency: {
                type: String,
                enum: ['daily', 'weekly', 'biweekly', 'monthly'],
                default: 'weekly'
            },
            minimumAmount: { type: Number, default: 10000 },
            payoutDay: { type: Number, default: 1 }, // 1=Monday, 7=Sunday
            maxAutoPayoutAmount: { type: Number, default: 500000 }
        },

        // Platform Commission
        commissionRate: { type: Number, default: 10 } // percentage
    },
    {
        timestamps: true
    }
);

// Ensure only one settings document exists
siteSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

export default SiteSettings;
