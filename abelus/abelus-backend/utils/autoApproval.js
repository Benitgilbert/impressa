import prisma from "../prisma.js";

/**
 * Calculate seller approval score based on profile completeness
 */
export const calculateSellerScore = (user, criteria) => {
    const breakdown = {};
    let score = 0;

    if (user.email) {
        breakdown.emailVerified = criteria.emailVerified || 30;
        score += breakdown.emailVerified;
    }

    if (user.storePhone) {
        breakdown.phoneProvided = criteria.phoneProvided || 20;
        score += breakdown.phoneProvided;
    }

    if (user.storeName && user.storeName.trim()) {
        breakdown.storeNameSet = criteria.storeNameSet || 20;
        score += breakdown.storeNameSet;
    }

    if (user.storeDescription && user.storeDescription.trim()) {
        breakdown.storeDescriptionSet = criteria.storeDescriptionSet || 15;
        score += breakdown.storeDescriptionSet;
    }

    if (user.storeLogo || user.profileImage) {
        breakdown.profilePhotoSet = criteria.profilePhotoSet || 15;
        score += breakdown.profilePhotoSet;
    }

    return { score, breakdown };
};

/**
 * Check if a seller should be auto-approved
 */
export const checkAutoApproval = async (user) => {
    try {
        const settingsRecord = await prisma.siteSettings.findUnique({ where: { key: 'general' } });
        const settings = settingsRecord?.value || {};
        const autoApproval = settings.sellerAutoApproval || {};

        if (!autoApproval.enabled) {
            return { shouldApprove: false, reason: 'Auto-approval disabled' };
        }

        const criteria = autoApproval.criteria || {};
        const minScore = autoApproval.minScore || 80;

        const { score, breakdown } = calculateSellerScore(user, criteria);

        return {
            shouldApprove: score >= minScore,
            score,
            minScore,
            breakdown,
            reason: score >= minScore
                ? 'Profile meets auto-approval criteria'
                : `Score ${score} below minimum ${minScore}`
        };
    } catch (error) {
        console.error('Auto-approval check failed:', error);
        return { shouldApprove: false, reason: 'Check failed', error: error.message };
    }
};

/**
 * Process seller auto-approval
 */
export const processSellerAutoApproval = async (userId) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.role !== 'seller') {
            return { success: false, message: 'User not found or not a seller' };
        }

        if (user.sellerStatus !== 'pending') {
            return { success: false, message: 'Seller already processed' };
        }

        const result = await checkAutoApproval(user);

        if (result.shouldApprove) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    sellerStatus: 'active',
                    autoApproved: true,
                    approvedAt: new Date()
                }
            });

            return {
                success: true,
                approved: true,
                message: 'Seller auto-approved',
                score: result.score,
                breakdown: result.breakdown
            };
        }

        return {
            success: true,
            approved: false,
            message: 'Pending manual review',
            score: result.score,
            minScore: result.minScore,
            breakdown: result.breakdown
        };
    } catch (error) {
        console.error('Process auto-approval failed:', error);
        return { success: false, message: error.message };
    }
};

export default {
    calculateSellerScore,
    checkAutoApproval,
    processSellerAutoApproval
};
