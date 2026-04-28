import cron from "node-cron";
import prisma from "../prisma.js";
import { sendEmail } from "../utils/emailService.js";

/**
 * 📊 Report Generation Cron - Monthly seller performance reports
 */

/**
 * Generate report for a single seller
 */
export const generateSellerReport = async (sellerId, periodStart, periodEnd) => {
    try {
        const seller = await prisma.user.findUnique({ where: { id: sellerId } });
        if (!seller || seller.role !== "seller") {
            return { success: false, message: "Invalid seller" };
        }

        const report = await prisma.sellerReport.create({
            data: {
                sellerId,
                periodType: "monthly",
                periodStart,
                periodEnd,
                status: "generating"
            }
        });

        // Get orders in period
        const orders = await prisma.order.findMany({
            where: {
                items: { some: { product: { sellerId } } },
                createdAt: { gte: periodStart, lte: periodEnd }
            },
            include: { items: { include: { product: true } } }
        });

        let totalOrders = 0;
        let completedOrders = 0;
        let cancelledOrders = 0;
        let grossRevenue = 0;

        orders.forEach(order => {
            const sellerItems = order.items.filter(item => item.product.sellerId === sellerId);
            if (sellerItems.length > 0) {
                totalOrders++;
                if (order.status === "delivered") {
                    completedOrders++;
                    grossRevenue += sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                } else if (order.status === "cancelled") {
                    cancelledOrders++;
                }
            }
        });

        // Get platform fees from payouts in this period
        const payouts = await prisma.payout.findMany({
            where: {
                sellerId,
                status: "completed",
                updatedAt: { gte: periodStart, lte: periodEnd }
            }
        });

        const commissionPaid = payouts.reduce((sum, p) => sum + (p.platformFee || 0), 0);
        const netRevenue = grossRevenue - commissionPaid;
        const avgOrderValue = completedOrders > 0 ? grossRevenue / completedOrders : 0;
        const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

        const sales = {
            totalOrders, completedOrders, cancelledOrders,
            grossRevenue, netRevenue, commissionPaid,
            averageOrderValue: avgOrderValue
        };

        // Product metrics
        const [totalProducts, activeProducts, newProducts, lowStockProducts] = await Promise.all([
            prisma.product.count({ where: { sellerId } }),
            prisma.product.count({ where: { sellerId, visibility: "public", approvalStatus: "approved" } }),
            prisma.product.count({ where: { sellerId, createdAt: { gte: periodStart, lte: periodEnd } } }),
            prisma.product.count({ where: { sellerId, stock: { gt: 0, lte: 10 } } })
        ]);

        const products = { totalProducts, activeProducts, newProducts, lowStockProducts };

        // Top products via aggregation
        const topProductsAgg = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                product: { sellerId },
                order: { status: 'delivered', createdAt: { gte: periodStart, lte: periodEnd } }
            },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const topProducts = await Promise.all(topProductsAgg.map(async (p) => {
            const info = await prisma.product.findUnique({ where: { id: p.productId }, select: { name: true } });
            return {
                productId: p.productId,
                productName: info?.name || "Unknown",
                unitsSold: p._sum.quantity,
                revenue: 0 // Simplification for now
            };
        }));

        await prisma.sellerReport.update({
            where: { id: report.id },
            data: {
                status: "ready",
                sales,
                products,
                topProducts,
                performance: { cancellationRate }
            }
        });

        return { success: true, reportId: report.id };

    } catch (error) {
        console.error(`[Report] Error generating for seller ${sellerId}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate reports for all active sellers
 */
export const generateAllSellerReports = async () => {
    console.log("[Report Cron] Starting monthly report generation...");

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);

    const sellers = await prisma.user.findMany({ where: { role: "seller", sellerStatus: "active" } });
    const results = [];

    for (const seller of sellers) {
        const existing = await prisma.sellerReport.findFirst({
            where: {
                sellerId: seller.id,
                periodStart: { gte: periodStart },
                periodEnd: { lte: periodEnd }
            }
        });

        if (existing) continue;

        const result = await generateSellerReport(seller.id, periodStart, periodEnd);
        results.push({ sellerId: seller.id, storeName: seller.storeName, ...result });
    }

    return results;
};

/**
 * Send report email to seller
 */
export const sendReportEmail = async (reportId) => {
    const report = await prisma.sellerReport.findUnique({
        where: { id: reportId },
        include: { seller: { select: { name: true, email: true, storeName: true } } }
    });

    if (!report || report.status !== "ready") return { success: false, message: "Report not ready" };

    const seller = report.seller;
    const monthName = report.periodStart.toLocaleString('default', { month: 'long', year: 'numeric' });

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">📊 Your ${monthName} Performance Report</h2>
        <p>Hi ${seller.name},</p>
        <p>Here's your monthly summary for <strong>${seller.storeName}</strong>:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <table style="width: 100%;">
                <tr><td>Total Orders</td><td style="text-align: right;">${report.sales.totalOrders}</td></tr>
                <tr><td>Gross Revenue</td><td style="text-align: right;">${report.sales.grossRevenue.toLocaleString()} RWF</td></tr>
                <tr style="border-top: 1px solid #ccc;"><td><strong>Net Revenue</strong></td><td style="text-align: right;"><strong>${report.sales.netRevenue.toLocaleString()} RWF</strong></td></tr>
            </table>
        </div>
        <p>Log in to your dashboard to see the full breakdown.</p>
    </div>`;

    const result = await sendEmail({
        to: seller.email,
        subject: `📊 Your ${monthName} Performance Report - Abelus`,
        html
    });

    if (result.success) {
        await prisma.sellerReport.update({
            where: { id: reportId },
            data: { status: "sent", sentAt: new Date() }
        });
    }

    return result;
};

/**
 * Initialize monthly report cron job
 */
export const initReportCron = () => {
    cron.schedule("0 7 1 * *", async () => {
        console.log(`[Report Cron] Running monthly reports at ${new Date().toISOString()}`);
        const results = await generateAllSellerReports();
        for (const result of results) {
            if (result.success && result.reportId) {
                await sendReportEmail(result.reportId);
            }
        }
    });
    console.log("[Report Cron] Initialized - runs 1st of each month at 7 AM");
};

export default {
    generateSellerReport,
    generateAllSellerReports,
    sendReportEmail,
    initReportCron
};
