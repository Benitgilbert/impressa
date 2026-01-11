import Payout from "../models/Payout.js";
import SellerEarning from "../models/SellerEarning.js";
import CommissionSettings from "../models/CommissionSettings.js";
import { recordTransaction } from "./financeController.js";
import Account from "../models/Account.js";
import { notifyPayoutRequest, notifyPayoutProcessed } from "./notificationController.js";

/**
 * Request a payout (seller)
 */
export const requestPayout = async (req, res, next) => {
    try {
        const sellerId = req.user._id;
        const { paymentMethod, paymentDetails } = req.body;

        // Get commission settings
        const settings = await CommissionSettings.getSettings();

        // Calculate available balance
        const availableEarnings = await SellerEarning.find({
            seller: sellerId,
            status: { $in: ["pending", "confirmed"] },
            payout: null
        });

        const availableBalance = availableEarnings.reduce((sum, e) => sum + e.netAmount, 0);

        if (availableBalance < settings.minimumPayoutAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum payout amount is RWF ${settings.minimumPayoutAmount.toLocaleString()}`
            });
        }

        // Check for existing pending payout
        const existingPayout = await Payout.findOne({
            seller: sellerId,
            status: { $in: ["pending", "processing"] }
        });

        if (existingPayout) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending payout request"
            });
        }

        // Create payout request
        const payout = await Payout.create({
            seller: sellerId,
            amount: availableBalance,
            paymentMethod: paymentMethod || "mobile_money",
            paymentDetails: paymentDetails || {},
            earnings: availableEarnings.map(e => e._id),
            earningsCount: availableEarnings.length
        });

        // Mark earnings as linked to this payout
        await SellerEarning.updateMany(
            { _id: { $in: availableEarnings.map(e => e._id) } },
            { payout: payout._id }
        );

        // 🔔 Notify Admin
        try {
            notifyPayoutRequest(req.user.name, payout.amount);
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
 * Get seller's payouts (seller)
 */
export const getMyPayouts = async (req, res, next) => {
    try {
        const sellerId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { seller: sellerId };
        if (status) filter.status = status;

        const payouts = await Payout.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Payout.countDocuments(filter);

        res.json({
            success: true,
            data: payouts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all payouts (admin)
 */
export const getAllPayouts = async (req, res, next) => {
    try {
        const { status, sellerId, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (sellerId) filter.seller = sellerId;

        const payouts = await Payout.find(filter)
            .populate('seller', 'name email storeName storePhone')
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Payout.countDocuments(filter);

        // Stats
        const pendingCount = await Payout.countDocuments({ status: "pending" });
        const pendingAmount = await Payout.aggregate([
            { $match: { status: "pending" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            success: true,
            data: payouts,
            stats: {
                pendingCount,
                pendingAmount: pendingAmount[0]?.total || 0
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Process payout (admin) - approve/reject
 */
export const processPayout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, transactionId, adminNote, rejectionReason } = req.body;

        const payout = await Payout.findById(id).populate('seller', 'name');

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: "Payout not found"
            });
        }

        if (payout.status !== "pending" && payout.status !== "processing") {
            return res.status(400).json({
                success: false,
                message: `Cannot process payout with status: ${payout.status}`
            });
        }

        if (action === "approve" || action === "complete") {
            payout.status = "completed";
            payout.transactionId = transactionId;
            payout.adminNote = adminNote;
            payout.processedBy = req.user._id;
            payout.processedAt = new Date();

            // Mark all linked earnings as paid
            await SellerEarning.updateMany(
                { payout: payout._id },
                { status: "paid", paidAt: new Date() }
            );

            // 💰 Automate Finance: Record Payout Transaction
            try {
                const accounts = await Account.find({ code: { $in: ["1001", "2001"] } });
                const bankAcc = accounts.find(a => a.code === "1001");    // Cash/Bank (Asset)
                const payableAcc = accounts.find(a => a.code === "2001"); // Seller Payable (Liability)

                if (bankAcc && payableAcc) {
                    await recordTransaction({
                        date: new Date(),
                        description: `Payout to ${payout.seller?.name || "Seller"} (Ref: ${transactionId || "N/A"})`,
                        reference: `Payout #${payout._id.toString().substring(18)}`,
                        type: "Payment",
                        entries: [
                            { account: payableAcc._id, debit: payout.amount }, // Reduce Liability (Debit)
                            { account: bankAcc._id, credit: payout.amount }    // Reduce Asset (Credit)
                        ],
                        createdBy: req.user._id
                    });
                }
            } catch (finErr) {
                console.error("Failed to record payout transaction", finErr);
            }
        } else if (action === "reject") {
            payout.status = "rejected";
            payout.rejectionReason = rejectionReason;
            payout.processedBy = req.user._id;
            payout.processedAt = new Date();

            // Unlink earnings so seller can request again
            await SellerEarning.updateMany(
                { payout: payout._id },
                { payout: null }
            );
        } else if (action === "processing") {
            payout.status = "processing";
            payout.adminNote = adminNote;
        }

        await payout.save();

        // 🔔 Notify Seller
        try {
            if (action === "approve" || action === "complete" || action === "reject") {
                notifyPayoutProcessed(payout.seller?._id, payout.amount, action === "reject" ? "rejected" : "completed");
            }
        } catch (e) { }

        res.json({
            success: true,
            message: `Payout ${action === "approve" || action === "complete" ? "completed" : action === "reject" ? "rejected" : "updated"}`,
            data: payout
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel payout (seller - only if pending)
 */
export const cancelPayout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sellerId = req.user._id;

        const payout = await Payout.findOne({ _id: id, seller: sellerId });

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: "Payout not found"
            });
        }

        if (payout.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Can only cancel pending payouts"
            });
        }

        payout.status = "cancelled";
        await payout.save();

        // Unlink earnings
        await SellerEarning.updateMany(
            { payout: payout._id },
            { payout: null }
        );

        res.json({
            success: true,
            message: "Payout cancelled"
        });
    } catch (error) {
        next(error);
    }
};
