import SellerViolation from "../models/SellerViolation.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { notifyViolation } from "../controllers/notificationController.js";

/**
 * Violation Tracker - Auto-detects seller violations based on metrics
 */

// Thresholds for auto-detection
const THRESHOLDS = {
    cancellationRate: 20, // % - if > 20% orders cancelled
    slowFulfillmentHours: 72, // hours - if avg > 72 hours to ship
    complaintThreshold: 5, // number of complaints
    lowRatingThreshold: 2.5, // average rating below this
    penaltyPointsForSuspension: 15 // auto-suspend at this level
};

// Penalty points per violation type
const PENALTY_POINTS = {
    high_cancellation_rate: 3,
    slow_fulfillment: 2,
    customer_complaints: 4,
    fake_product: 10,
    policy_violation: 5,
    payment_issue: 3,
    low_rating: 2,
    other: 1
};

/**
 * Check seller for cancellation rate violations
 */
export const checkCancellationRate = async (sellerId) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get seller's orders in last 30 days
    const orders = await Order.find({
        "items.seller": sellerId,
        createdAt: { $gte: thirtyDaysAgo }
    });

    if (orders.length < 5) return null; // Need minimum orders for accurate rate

    let totalOrders = 0;
    let cancelledOrders = 0;

    orders.forEach(order => {
        const hasSellerItems = order.items.some(item =>
            item.seller && item.seller.toString() === sellerId.toString()
        );
        if (hasSellerItems) {
            totalOrders++;
            if (order.status === "cancelled") {
                cancelledOrders++;
            }
        }
    });

    const rate = (cancelledOrders / totalOrders) * 100;

    if (rate > THRESHOLDS.cancellationRate) {
        return {
            type: "high_cancellation_rate",
            severity: rate > 40 ? "review" : "warning",
            description: `Cancellation rate of ${rate.toFixed(1)}% exceeds threshold of ${THRESHOLDS.cancellationRate}%`,
            metrics: {
                cancellationRate: rate,
                affectedOrders: cancelledOrders
            },
            penaltyPoints: PENALTY_POINTS.high_cancellation_rate
        };
    }

    return null;
};

/**
 * Check seller for slow fulfillment
 */
export const checkFulfillmentTime = async (sellerId) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
        "items.seller": sellerId,
        status: { $in: ["shipped", "delivered"] },
        createdAt: { $gte: thirtyDaysAgo },
        shippedAt: { $exists: true }
    });

    if (orders.length < 3) return null;

    let totalHours = 0;
    let count = 0;

    orders.forEach(order => {
        const hasSellerItems = order.items.some(item =>
            item.seller && item.seller.toString() === sellerId.toString()
        );
        if (hasSellerItems && order.shippedAt) {
            const hours = (order.shippedAt - order.createdAt) / (1000 * 60 * 60);
            totalHours += hours;
            count++;
        }
    });

    const avgHours = totalHours / count;

    if (avgHours > THRESHOLDS.slowFulfillmentHours) {
        return {
            type: "slow_fulfillment",
            severity: avgHours > 120 ? "review" : "warning",
            description: `Average fulfillment time of ${avgHours.toFixed(1)} hours exceeds threshold of ${THRESHOLDS.slowFulfillmentHours} hours`,
            metrics: {
                averageFulfillmentTime: avgHours,
                affectedOrders: count
            },
            penaltyPoints: PENALTY_POINTS.slow_fulfillment
        };
    }

    return null;
};

/**
 * Run all violation checks for a seller
 */
export const runViolationChecks = async (sellerId) => {
    const violations = [];

    const cancellationViolation = await checkCancellationRate(sellerId);
    if (cancellationViolation) violations.push(cancellationViolation);

    const fulfillmentViolation = await checkFulfillmentTime(sellerId);
    if (fulfillmentViolation) violations.push(fulfillmentViolation);

    return violations;
};

/**
 * Process and create violation records
 */
export const processViolations = async (sellerId) => {
    try {
        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== "seller") {
            return { success: false, message: "Invalid seller" };
        }

        const detectedViolations = await runViolationChecks(sellerId);
        const createdViolations = [];

        for (const violation of detectedViolations) {
            // Check if similar violation already exists in last 7 days
            const existingViolation = await SellerViolation.findOne({
                seller: sellerId,
                type: violation.type,
                status: "active",
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });

            if (existingViolation) continue; // Don't create duplicate

            const newViolation = new SellerViolation({
                seller: sellerId,
                ...violation,
                detectedBy: "system",
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
            });

            await newViolation.save();
            createdViolations.push(newViolation);

            // 🔔 Notify Admin
            try {
                notifyViolation(newViolation.type, seller.storeName || seller.name);
            } catch (e) { }
        }

        // Check total penalty points for auto-suspension
        const totalPoints = await SellerViolation.getTotalPenaltyPoints(sellerId);

        if (totalPoints >= THRESHOLDS.penaltyPointsForSuspension) {
            // Auto-suspend seller
            seller.sellerStatus = "rejected";
            await seller.save();

            // Create suspension violation
            const suspensionViolation = new SellerViolation({
                seller: sellerId,
                type: "policy_violation",
                severity: "suspension",
                description: `Account auto-suspended due to accumulated ${totalPoints} penalty points`,
                penaltyPoints: 0,
                detectedBy: "system",
                actionsTaken: [{
                    action: "account_suspended",
                    note: `Auto-suspended at ${totalPoints} penalty points`
                }]
            });
            await suspensionViolation.save();
            createdViolations.push(suspensionViolation);
        }

        return {
            success: true,
            violationsCreated: createdViolations.length,
            totalPenaltyPoints: totalPoints,
            violations: createdViolations
        };

    } catch (error) {
        console.error("Violation processing error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Run violation checks for all active sellers
 */
export const runAllSellerChecks = async () => {
    console.log("[Violation Tracker] Running checks for all sellers...");

    const sellers = await User.find({ role: "seller", sellerStatus: "active" });
    const results = [];

    for (const seller of sellers) {
        const result = await processViolations(seller._id);
        if (result.violationsCreated > 0) {
            results.push({
                sellerId: seller._id,
                storeName: seller.storeName,
                ...result
            });
        }
    }

    console.log(`[Violation Tracker] Complete. Found violations for ${results.length} sellers.`);
    return results;
};

export default {
    checkCancellationRate,
    checkFulfillmentTime,
    runViolationChecks,
    processViolations,
    runAllSellerChecks,
    THRESHOLDS,
    PENALTY_POINTS
};
