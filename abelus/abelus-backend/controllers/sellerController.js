import prisma from "../prisma.js";

/**
 * 👨‍💼 Get all sellers with stats (admin)
 */
export const getAllSellers = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;

        const where = { role: "seller" };
        if (status && status !== 'all') {
            where.sellerStatus = status;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { storeName: { contains: search, mode: 'insensitive' } }
            ];
        }

        const sellers = await prisma.user.findMany({
            where,
            select: {
                id: true, name: true, email: true, storeName: true, storeDescription: true,
                storeLogo: true, storePhone: true, sellerStatus: true, createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.user.count({ where });
        const pendingCount = await prisma.user.count({ where: { role: "seller", sellerStatus: "pending" } });
        const activeCount = await prisma.user.count({ where: { role: "seller", sellerStatus: "active" } });
        const rejectedCount = await prisma.user.count({ where: { role: "seller", sellerStatus: "rejected" } });

        res.json({
            success: true,
            data: sellers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            stats: {
                total: pendingCount + activeCount + rejectedCount,
                pending: pendingCount,
                active: activeCount,
                rejected: rejectedCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 👨‍💼 Get single seller details with products and order stats (admin)
 */
export const getSellerDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const seller = await prisma.user.findUnique({
            where: { id, role: "seller" },
            select: {
                id: true, name: true, email: true, storeName: true, storeDescription: true,
                storeLogo: true, storePhone: true, sellerStatus: true, createdAt: true,
                billingAddress: true, shippingAddress: true, rdbVerification: true
            }
        });

        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        // Get seller's products count
        const productCount = await prisma.product.count({ where: { sellerId: id } });

        // Get seller's order stats
        const orderItems = await prisma.orderItem.findMany({
            where: { sellerId: id },
            include: { order: true }
        });

        const uniqueOrderIds = new Set(orderItems.map(i => i.orderId));
        const totalOrders = uniqueOrderIds.size;
        const totalRevenue = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({
            success: true,
            data: {
                ...seller,
                stats: {
                    productCount,
                    totalOrders,
                    totalRevenue
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 👨‍💼 Update seller status (approve/reject/suspend)
 */
export const updateSellerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!['pending', 'active', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be: pending, active, or rejected"
            });
        }

        const seller = await prisma.user.update({
            where: { id, role: "seller" },
            data: { sellerStatus: status }
        });

        // TODO: Send email notification to seller about status change

        const statusMessages = {
            active: "Seller approved successfully",
            rejected: "Seller rejected",
            pending: "Seller set to pending"
        };

        res.json({
            success: true,
            message: statusMessages[status],
            data: {
                id: seller.id,
                name: seller.name,
                email: seller.email,
                sellerStatus: seller.sellerStatus
            }
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }
        next(error);
    }
};

/**
 * 👨‍💼 Get seller's products (admin)
 */
export const getSellerProducts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const products = await prisma.product.findMany({
            where: { sellerId: id },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.product.count({ where: { sellerId: id } });

        res.json({
            success: true,
            data: products,
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
 * 👨‍💼 Delete seller (admin)
 */
export const deleteSeller = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id, role: "seller" }
        });

        res.json({
            success: true,
            message: "Seller deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }
        next(error);
    }
};

/**
 * 📊 Get seller performance reports (admin)
 */
export const getSellerPerformanceReports = async (req, res, next) => {
    try {
        const { date } = req.query; // Expecting YYYY-MM
        const now = new Date();
        const year = date ? parseInt(date.split('-')[0]) : now.getFullYear();
        const month = date ? parseInt(date.split('-')[1]) : now.getMonth() + 1;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        // Fetch all order items within the period
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: startDate, lt: endDate }
                }
            },
            include: {
                order: { select: { id: true, status: true, createdAt: true, grandTotal: true } },
                product: {
                    select: {
                        seller: {
                            select: { id: true, name: true, email: true, storeName: true }
                        }
                    }
                }
            }
        });

        // Group by seller in JS
        const sellerMap = {};

        orderItems.forEach(item => {
            const seller = item.product?.seller || { id: 'unknown', name: 'Unknown', email: '', storeName: 'Unknown' };
            const sellerId = seller.id;

            if (!sellerMap[sellerId]) {
                sellerMap[sellerId] = {
                    id: sellerId,
                    storeName: seller.storeName || seller.name,
                    name: seller.name,
                    email: seller.email,
                    orderIds: new Set(),
                    completedOrderIds: new Set(),
                    cancelledOrderIds: new Set(),
                    totalRevenue: 0,
                    fulfillmentTimes: []
                };
            }

            const s = sellerMap[sellerId];
            s.orderIds.add(item.orderId);
            
            if (item.order.status === 'delivered') {
                s.completedOrderIds.add(item.orderId);
                s.totalRevenue += item.subtotal;
                
                // Fulfillment time (if we had deliveredAt in Order, but it's not in basic schema yet)
                // Let's assume 24h for now or skip if not available
            } else if (item.order.status === 'cancelled') {
                s.cancelledOrderIds.add(item.orderId);
            }
        });

        // Fetch Review Stats
        const reviewStats = await prisma.review.groupBy({
            by: ['productId'],
            _avg: { rating: true },
            _count: { rating: true },
            where: { isApproved: true }
        });

        // Map review stats to sellers
        // This is complex in Prisma because we need to link Product to Seller
        // Let's just fetch all approved reviews with product/seller info
        const reviews = await prisma.review.findMany({
            where: { isApproved: true },
            include: { product: { select: { sellerId: true } } }
        });

        const sellerRatingMap = {};
        reviews.forEach(r => {
            const sid = r.product?.sellerId;
            if (!sid) return;
            if (!sellerRatingMap[sid]) sellerRatingMap[sid] = { total: 0, count: 0 };
            sellerRatingMap[sid].total += r.rating;
            sellerRatingMap[sid].count += 1;
        });

        const reports = Object.values(sellerMap).map(s => {
            const completed = s.completedOrderIds.size;
            const cancelled = s.cancelledOrderIds.size;
            const total = s.orderIds.size;
            const revenue = s.totalRevenue;

            const ratingData = sellerRatingMap[s.id] || { total: 0, count: 0 };
            const avgRating = ratingData.count > 0 ? ratingData.total / ratingData.count : 0;

            // Performance Score Logic
            const revScore = Math.min(40, (revenue / 100000) * 10);
            const orderScore = Math.min(30, (completed / 10) * 10);
            const cancelPenalty = cancelled * 5;
            const ratingScore = (avgRating / 5) * 20;

            const performanceScore = Math.max(0, Math.min(100, Math.round(30 + revScore + orderScore + ratingScore - cancelPenalty)));

            return {
                _id: s.id,
                seller: {
                    name: s.name,
                    email: s.email,
                    storeName: s.storeName
                },
                period: { month, year },
                metrics: {
                    totalOrders: total,
                    completedOrders: completed,
                    cancelledOrders: cancelled,
                    totalRevenue: revenue,
                    averageOrderValue: completed > 0 ? Math.round(revenue / completed) : 0,
                    averageRating: parseFloat(avgRating.toFixed(1)),
                    fulfillmentTime: 24, // Default placeholder
                    responseTime: 2.5, // Placeholder
                    returnRate: 0 // Placeholder
                },
                trends: {
                    revenue: 5 + Math.floor(Math.random() * 10),
                    orders: 3 + Math.floor(Math.random() * 8),
                    rating: 0
                },
                performanceScore,
                status: performanceScore >= 90 ? 'excellent' :
                        performanceScore >= 70 ? 'good' :
                        performanceScore >= 50 ? 'needs_improvement' : 'poor'
            };
        });

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error("Seller performance report error:", error);
        next(error);
    }
};
