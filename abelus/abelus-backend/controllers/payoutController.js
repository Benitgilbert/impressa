import prisma from "../prisma.js";
import { recordTransaction } from "./financeController.js";
import { notifyPayoutRequest, notifyPayoutProcessed } from "./notificationController.js";

/**
 * 💸 Request a payout (seller)
 */
export const requestPayout = async (req, res, next) => {
    try {
        const sellerId = req.user.id;
        const { paymentMethod, paymentDetails } = req.body;

        // Get commission settings
        const settings = await prisma.commissionSettings.findFirst() || { defaultRate: 10, minimumPayoutAmount: 10000 };
        const minPayout = settings.minimumPayoutAmount || 10000;

        // Calculate available balance
        const availableEarnings = await prisma.sellerEarning.findMany({
            where: {
                sellerId: sellerId,
                status: { in: ["pending", "confirmed"] },
                payoutId: null
            }
        });

        const availableBalance = availableEarnings.reduce((sum, e) => sum + e.netAmount, 0);

        if (availableBalance < minPayout) {
            return res.status(400).json({
                success: false,
                message: `Minimum payout amount is RWF ${minPayout.toLocaleString()}. Your balance: RWF ${availableBalance.toLocaleString()}`
            });
        }

        // Check for existing pending payout
        const existingPayout = await prisma.payout.findFirst({
            where: {
                sellerId: sellerId,
                status: { in: ["pending", "processing"] }
            }
        });

        if (existingPayout) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending payout request"
            });
        }

        // Create payout request
        const payoutId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const payout = await prisma.payout.create({
            data: {
                payoutId,
                sellerId: sellerId,
                amount: availableBalance,
                paymentMethod: paymentMethod || "mobile_money",
                paymentDetails: paymentDetails || {},
                earnings: {
                    connect: availableEarnings.map(e => ({ id: e.id }))
                }
            }
        });

        // 🔔 Notify Admin
        try {
            const user = await prisma.user.findUnique({ where: { id: sellerId }, select: { name: true } });
            notifyPayoutRequest(user?.name || "Seller", payout.amount);
        } catch (e) { }

        res.status(201).json({
            success: true,
            message: "Payout request submitted successfully",
            data: payout
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 💸 Get seller's payouts (seller)
 */
export const getMyPayouts = async (req, res, next) => {
    try {
        const sellerId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        const where = { sellerId };
        if (status) where.status = status;

        const payouts = await prisma.payout.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.payout.count({ where });

        res.json({
            success: true,
            data: payouts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 💸 Get all payouts (admin)
 */
export const getAllPayouts = async (req, res, next) => {
    try {
        const { status, sellerId, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (sellerId) where.sellerId = sellerId;

        const payouts = await prisma.payout.findMany({
            where,
            include: {
                seller: { select: { name: true, email: true, storeName: true, storePhone: true } },
                processedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.payout.count({ where });

        // Stats
        const pendingCount = await prisma.payout.count({ where: { status: "pending" } });
        const pendingAmountResult = await prisma.payout.aggregate({
            _sum: { amount: true },
            where: { status: "pending" }
        });

        res.json({
            success: true,
            data: payouts,
            stats: {
                pendingCount,
                pendingAmount: pendingAmountResult._sum.amount || 0
            },
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 💸 Process payout (admin) - approve/reject
 */
export const processPayout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, transactionId, adminNote, rejectionReason } = req.body;

        const payout = await prisma.payout.findUnique({
            where: { id },
            include: { seller: { select: { id: true, name: true } } }
        });

        if (!payout) {
            return res.status(404).json({ success: false, message: "Payout not found" });
        }

        if (payout.status !== "pending" && payout.status !== "processing") {
            return res.status(400).json({
                success: false,
                message: `Cannot process payout with status: ${payout.status}`
            });
        }

        let updateData = {};
        if (action === "approve" || action === "complete") {
            updateData = {
                status: "completed",
                transactionId,
                adminNote,
                processedById: req.user.id,
                processedAt: new Date(),
                earnings: {
                    updateMany: {
                        where: { payoutId: payout.id },
                        data: { status: "paid", paidAt: new Date() }
                    }
                }
            };

            // 💰 Automate Finance: Record Payout Transaction
            try {
                const bankAcc = await prisma.account.findUnique({ where: { code: "1001" } });
                const payableAcc = await prisma.account.findUnique({ where: { code: "2001" } });

                if (bankAcc && payableAcc) {
                    await recordTransaction({
                        date: new Date(),
                        description: `Payout to ${payout.seller?.name || "Seller"} (Ref: ${transactionId || "N/A"})`,
                        reference: `Payout #${payout.payoutId}`,
                        type: "Payment",
                        entries: [
                            { accountId: payableAcc.id, debit: payout.amount }, // Reduce Liability (Debit)
                            { accountId: bankAcc.id, credit: payout.amount }    // Reduce Asset (Credit)
                        ],
                        createdBy: req.user.id
                    });
                }
            } catch (finErr) {
                console.error("Failed to record payout transaction", finErr);
            }
        } else if (action === "reject") {
            updateData = {
                status: "rejected",
                rejectionReason,
                processedById: req.user.id,
                processedAt: new Date(),
                earnings: {
                    disconnect: true // Unlink all earnings so they can be requested again
                }
            };
        } else if (action === "processing") {
            updateData = {
                status: "processing",
                adminNote
            };
        }

        const updatedPayout = await prisma.payout.update({
            where: { id },
            data: updateData,
            include: { seller: true }
        });

        // 🔔 Notify Seller
        try {
            if (action === "approve" || action === "complete" || action === "reject") {
                notifyPayoutProcessed(payout.seller?.id, payout.amount, action === "reject" ? "rejected" : "completed");
            }
        } catch (e) { }

        res.json({
            success: true,
            message: `Payout ${action === "approve" || action === "complete" ? "completed" : action === "reject" ? "rejected" : "updated"}`,
            data: updatedPayout
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 💸 Cancel payout (seller - only if pending)
 */
export const cancelPayout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;

        const payout = await prisma.payout.findFirst({
            where: { id, sellerId }
        });

        if (!payout) {
            return res.status(404).json({ success: false, message: "Payout not found" });
        }

        if (payout.status !== "pending") {
            return res.status(400).json({ success: false, message: "Can only cancel pending payouts" });
        }

        const updatedPayout = await prisma.payout.update({
            where: { id },
            data: {
                status: "cancelled",
                earnings: {
                    disconnect: true // Unlink earnings
                }
            }
        });

        res.json({
            success: true,
            message: "Payout cancelled",
            data: updatedPayout
        });
    } catch (error) {
        next(error);
    }
};
