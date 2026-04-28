import cron from "node-cron";
import prisma from "../prisma.js";

/**
 * 💰 Process automated payouts for sellers
 */
export const processAutomatedPayouts = async () => {
    console.log("[Payout Cron] Starting automated payout processing...");

    try {
        const settingsRecord = await prisma.siteSettings.findUnique({ where: { key: 'general' } });
        const settings = settingsRecord?.value || {};
        const { autoPayoutEnabled, minimumAmount, maxAutoPayoutAmount } = settings.payoutSettings || {};
        const commissionRate = settings.commissionRate || 10;

        if (!autoPayoutEnabled) {
            console.log("[Payout Cron] Auto payouts disabled. Skipping.");
            return { success: true, message: "Auto payouts disabled", processed: 0 };
        }

        const activeSellers = await prisma.user.findMany({
            where: { role: "seller", sellerStatus: "active" }
        });

        console.log(`[Payout Cron] Processing ${activeSellers.length} active sellers...`);

        let processed = 0;
        let skipped = 0;
        const results = [];

        for (const seller of activeSellers) {
            try {
                // Get pending earnings for seller
                const earnings = await prisma.sellerEarning.findMany({
                    where: { sellerId: seller.id, status: { in: ['pending', 'confirmed'] } }
                });

                const totalPending = earnings.reduce((sum, e) => sum + e.netAmount, 0);
                const orderIds = [...new Set(earnings.map(e => e.orderId))];

                if (totalPending < (minimumAmount || 10000)) {
                    skipped++;
                    continue;
                }

                if (totalPending > (maxAutoPayoutAmount || 500000)) {
                    console.log(`[Payout Cron] Seller ${seller.id} exceeds max auto payout. Requires manual review.`);
                    skipped++;
                    continue;
                }

                const payout = await prisma.payout.create({
                    data: {
                        payoutId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        sellerId: seller.id,
                        amount: totalPending,
                        grossAmount: earnings.reduce((sum, e) => sum + e.grossAmount, 0),
                        platformFee: earnings.reduce((sum, e) => sum + (e.commissionAmount || 0), 0),
                        commissionRate,
                        orderIds,
                        status: "pending",
                        isAutomatic: true,
                        paymentMethod: seller.storePhone ? "mobile_money" : "bank_transfer",
                        paymentDetails: {
                            mobileNumber: seller.storePhone,
                            mobileOperator: "MTN"
                        }
                    }
                });

                // Update earnings status to processing
                await prisma.sellerEarning.updateMany({
                    where: { id: { in: earnings.map(e => e.id) } },
                    data: { status: 'processing' }
                });

                processed++;
                results.push({
                    sellerId: seller.id,
                    storeName: seller.storeName,
                    payoutId: payout.payoutId,
                    amount: totalPending,
                    status: "created"
                });

                console.log(`[Payout Cron] Created payout ${payout.payoutId} for seller ${seller.storeName}: ${totalPending} RWF`);

            } catch (err) {
                console.error(`[Payout Cron] Error processing seller ${seller.id}:`, err.message);
                results.push({ sellerId: seller.id, error: err.message });
            }
        }

        console.log(`[Payout Cron] Complete. Processed: ${processed}, Skipped: ${skipped}`);
        return { success: true, processed, skipped, results };

    } catch (error) {
        console.error("[Payout Cron] Fatal error:", error);
        return { success: false, error: error.message };
    }
};

const getCronSchedule = (frequency) => {
    switch (frequency) {
        case "daily": return "0 6 * * *";
        case "weekly": return "0 6 * * 1";
        case "biweekly": return "0 6 1,15 * *";
        case "monthly": return "0 6 1 * *";
        default: return "0 6 * * 1";
    }
};

export const initPayoutCron = async () => {
    try {
        const settingsRecord = await prisma.siteSettings.findUnique({ where: { key: 'general' } });
        const settings = settingsRecord?.value || {};
        const frequency = settings.payoutSettings?.frequency || "weekly";
        const schedule = getCronSchedule(frequency);

        console.log(`[Payout Cron] Initializing with schedule: ${schedule} (${frequency})`);

        cron.schedule(schedule, async () => {
            console.log(`[Payout Cron] Running scheduled payout at ${new Date().toISOString()}`);
            await processAutomatedPayouts();
        });

        console.log("[Payout Cron] Initialized successfully");
        return true;
    } catch (error) {
        console.error("[Payout Cron] Failed to initialize:", error);
        return false;
    }
};

export const triggerManualPayout = async (sellerId = null) => {
    if (sellerId) {
        const seller = await prisma.user.findUnique({ where: { id: sellerId } });
        if (!seller || seller.role !== "seller") {
            return { success: false, message: "Seller not found" };
        }

        const earnings = await prisma.sellerEarning.findMany({
            where: { sellerId, status: { in: ['pending', 'confirmed'] } }
        });

        if (earnings.length === 0) return { success: false, message: "No pending balance" };

        const totalPending = earnings.reduce((sum, e) => sum + e.netAmount, 0);
        const orderIds = [...new Set(earnings.map(e => e.orderId))];

        const payout = await prisma.payout.create({
            data: {
                payoutId: `PAY-MAN-${Date.now()}`,
                sellerId,
                amount: totalPending,
                grossAmount: earnings.reduce((sum, e) => sum + e.grossAmount, 0),
                platformFee: earnings.reduce((sum, e) => sum + (e.commissionAmount || 0), 0),
                orderIds,
                status: "pending",
                isAutomatic: false,
                paymentMethod: seller.storePhone ? "mobile_money" : "bank_transfer",
                paymentDetails: { mobileNumber: seller.storePhone }
            }
        });

        return {
            success: true,
            payout: {
                payoutId: payout.payoutId,
                amount: totalPending
            }
        };
    }

    return await processAutomatedPayouts();
};

export default {
    initPayoutCron,
    processAutomatedPayouts,
    triggerManualPayout
};
