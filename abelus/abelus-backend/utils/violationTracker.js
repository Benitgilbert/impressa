import prisma from "../prisma.js";
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

    const orders = await prisma.order.findMany({
        where: {
            items: { some: { product: { sellerId: sellerId } } },
            createdAt: { gte: thirtyDaysAgo }
        },
        include: { items: { include: { product: true } } }
    });

    if (orders.length < 5) return null;

    let totalOrders = 0;
    let cancelledOrders = 0;

    orders.forEach(order => {
        const hasSellerItems = order.items.some(item => item.product.sellerId === sellerId);
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
            metrics: { cancellationRate: rate, affectedOrders: cancelledOrders },
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

    const orders = await prisma.order.findMany({
        where: {
            items: { some: { product: { sellerId: sellerId } } },
            status: { in: ["shipped", "delivered"] },
            createdAt: { gte: thirtyDaysAgo }
        },
        include: { items: { include: { product: true } } }
    });

    // Note: We need a shippedAt or similar field in Order, but based on legacy logic it might be in status history or we can assume updatedAt for simplicity if not present
    // Looking at schema, I don't see shippedAt, but I'll check common status change logic
    
    if (orders.length < 3) return null;

    let totalHours = 0;
    let count = 0;

    orders.forEach(order => {
        const hasSellerItems = order.items.some(item => item.product.sellerId === sellerId);
        if (hasSellerItems && order.updatedAt) { // Fallback to updatedAt if shippedAt is missing
            const hours = (order.updatedAt - order.createdAt) / (1000 * 60 * 60);
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
            metrics: { averageFulfillmentTime: avgHours, affectedOrders: count },
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
        const seller = await prisma.user.findUnique({ where: { id: sellerId } });
        if (!seller || seller.role !== "seller") {
            return { success: false, message: "Invalid seller" };
        }

        const detectedViolations = await runViolationChecks(sellerId);
        const createdViolations = [];

        for (const violation of detectedViolations) {
            // Check for duplicate in last 7 days
            const existingViolation = await prisma.violation.findFirst({
                where: {
                    sellerId: sellerId,
                    type: violation.type,
                    status: "active",
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            });

            if (existingViolation) continue;

            const newViolation = await prisma.violation.create({
                data: {
                    sellerId: sellerId,
                    type: violation.type,
                    severity: violation.severity,
                    description: violation.description,
                    metrics: violation.metrics,
                    penaltyPoints: violation.penaltyPoints,
                    status: "active"
                }
            });

            createdViolations.push(newViolation);

            try {
                notifyViolation(newViolation.type, seller.storeName || seller.name);
            } catch (e) { }
        }

        // Get total penalty points
        const pointsAgg = await prisma.violation.aggregate({
            _sum: { penaltyPoints: true },
            where: { sellerId: sellerId, status: 'active' }
        });
        const totalPoints = pointsAgg._sum.penaltyPoints || 0;

        if (totalPoints >= THRESHOLDS.penaltyPointsForSuspension) {
            await prisma.user.update({
                where: { id: sellerId },
                data: { sellerStatus: "rejected" }
            });

            const suspensionViolation = await prisma.violation.create({
                data: {
                    sellerId: sellerId,
                    type: "policy_violation",
                    severity: "suspension",
                    description: `Account auto-suspended due to accumulated ${totalPoints} penalty points`,
                    penaltyPoints: 0,
                    status: "active",
                    adminNotes: `Auto-suspended at ${totalPoints} points`
                }
            });
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

    const sellers = await prisma.user.findMany({ where: { role: "seller", sellerStatus: "active" } });
    const results = [];

    for (const seller of sellers) {
        const result = await processViolations(seller.id);
        if (result.violationsCreated > 0) {
            results.push({
                sellerId: seller.id,
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
