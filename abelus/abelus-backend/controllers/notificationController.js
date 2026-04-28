import prisma from "../prisma.js";

/**
 * 🔔 Get user's notifications
 */
export const getMyNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;

        const where = { recipientId: req.user.id };
        if (unreadOnly === 'true') where.isRead = false;

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.notification.count({ where });
        const unreadCount = await prisma.notification.count({
            where: { recipientId: req.user.id, isRead: false }
        });

        res.json({
            success: true,
            data: notifications,
            unreadCount,
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
 * 🔔 Get unread count
 */
export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await prisma.notification.count({
            where: { recipientId: req.user.id, isRead: false }
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🔔 Mark notification as read
 */
export const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.update({
            where: { id, recipientId: req.user.id },
            data: { isRead: true, readAt: new Date() }
        });

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🔔 Mark all as read
 */
export const markAllAsRead = async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: { recipientId: req.user.id, isRead: false },
            data: { isRead: true, readAt: new Date() }
        });

        res.json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🔔 Delete notification
 */
export const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.notification.delete({
            where: { id, recipientId: req.user.id }
        });

        res.json({
            success: true,
            message: "Notification deleted"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🔔 Clear all notifications
 */
export const clearAllNotifications = async (req, res, next) => {
    try {
        await prisma.notification.deleteMany({
            where: { recipientId: req.user.id }
        });

        res.json({
            success: true,
            message: "All notifications cleared"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 📣 Create notification (internal use / admin)
 */
export const createNotification = async (recipientId, data) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                recipientId: recipientId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                relatedOrderId: data.orderId,
                relatedProductId: data.productId,
                relatedTicketId: data.ticketId,
                priority: data.priority || 'normal',
                icon: data.icon,
                color: data.color
            }
        });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};

/**
 * 📣 Notify All Admins
 */
export const notifyAdmins = async (data) => {
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { id: true }
        });
        const notifications = await Promise.all(admins.map(admin =>
            createNotification(admin.id, data)
        ));
        return notifications;
    } catch (error) {
        console.error('Failed to notify admins:', error);
    }
};

// Notification helper functions for different events

// CUSTOMER Notifications
export const notifyOrderPlaced = (userId, orderId, orderTotal) => {
    return createNotification(userId, {
        type: 'order_placed',
        title: 'Order Confirmed',
        message: `Your order has been placed successfully. Total: RWF ${orderTotal.toLocaleString()}`,
        link: `/orders/${orderId}`,
        orderId
    });
};

export const notifyOrderStatus = (userId, orderId, status) => {
    const statusMessages = {
        processing: 'Your order is being processed',
        shipped: 'Your order has been shipped',
        delivered: 'Your order has been delivered'
    };
    return createNotification(userId, {
        type: 'order_status',
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: statusMessages[status] || `Order status updated to ${status}`,
        link: `/orders/${orderId}`,
        orderId
    });
};

export const notifyPayoutProcessed = (sellerId, amount, status) => {
    return createNotification(sellerId, {
        type: status === 'completed' ? 'payout_processed' : 'payout_rejected',
        title: status === 'completed' ? 'Payout Completed' : 'Payout Rejected',
        message: status === 'completed'
            ? `Your payout of RWF ${amount.toLocaleString()} has been processed.`
            : `Your payout request of RWF ${amount.toLocaleString()} was rejected.`,
        link: `/seller/payouts`,
        priority: 'high'
    });
};

export const notifyProductApproved = (sellerId, productId, productName) => {
    return createNotification(sellerId, {
        type: 'product_approved',
        title: 'Product Approved',
        message: `Your product "${productName}" has been approved and is now live.`,
        link: `/seller/products`,
        productId
    });
};


// ADMIN Notifications (Broadcast to all admins)

export const notifyAdminNewOrder = (orderId, orderPublicId, amount, customerName) => {
    return notifyAdmins({
        type: 'new_order',
        title: 'New Order Received',
        message: `Order #${orderPublicId} placed by ${customerName || 'Guest'}. Amount: RWF ${amount.toLocaleString()}`,
        link: `/admin/orders`,
        priority: 'high',
        orderId
    });
};

export const notifyPayoutRequest = (sellerName, amount) => {
    return notifyAdmins({
        type: 'payout_request',
        title: 'New Payout Request',
        message: `${sellerName} requested a payout of RWF ${amount.toLocaleString()}`,
        link: `/admin/payouts`,
        priority: 'high'
    });
};

export const notifyProductAdded = (sellerName, productName) => {
    return notifyAdmins({
        type: 'product_added',
        title: 'New Product Pending Approval',
        message: `${sellerName} added "${productName}". Review it now.`,
        link: `/admin/product-approval`,
        priority: 'normal'
    });
};

export const notifyProductDeleted = (sellerName, productName) => {
    return notifyAdmins({
        type: 'product_deleted',
        title: 'Product Deleted',
        message: `${sellerName} deleted "${productName}".`,
        link: `/admin/products`,
        priority: 'normal'
    });
};

export const notifyViolation = (type, reporterName) => {
    return notifyAdmins({
        type: 'violation_report',
        title: 'New Violation Report',
        message: `A new ${type} violation has been reported by ${reporterName || 'a user'}.`,
        link: `/admin/violations`,
        priority: 'high'
    });
};

export const notifyReviewCreated = (productName, rating) => {
    return notifyAdmins({
        type: 'new_review',
        title: 'New Product Review',
        message: `New ${rating}-star review for "${productName}".`,
        link: `/admin/reviews`,
        priority: 'normal'
    });
};

export const notifyNewSubscriber = (email) => {
    return notifyAdmins({
        type: 'new_subscriber',
        title: 'New Newsletter Subscriber',
        message: `${email} has subscribed to the newsletter.`,
        link: `/admin/subscribers`,
        priority: 'low'
    });
};

export const notifyUserRegistered = (userName, role) => {
    return notifyAdmins({
        type: 'user_register',
        title: 'New User Registration',
        message: `${userName} just registered as a ${role}.`,
        link: role === 'seller' ? `/admin/sellers` : `/admin/users`,
        priority: 'normal'
    });
};

export const notifyFlashSaleCreated = (data) => {
    return notifyAdmins({
        type: 'flash_sale_update',
        title: 'Flash Sale Update',
        message: `Flash Sale "${data.name}" is now ${data.status || 'Active'}.`,
        link: `/admin/flash-sales`,
        priority: 'normal'
    });
};
