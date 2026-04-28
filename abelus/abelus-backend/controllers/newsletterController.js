import prisma from "../prisma.js";
import { notifyNewSubscriber } from "./notificationController.js";
import { sendWelcomeEmail } from "../utils/emailService.js";

/**
 * 📧 Subscribe to newsletter (public)
 */
export const subscribe = async (req, res, next) => {
    try {
        const { email, source } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const lowercaseEmail = email.toLowerCase();

        // Check if already subscribed
        const existing = await prisma.subscriber.findUnique({
            where: { email: lowercaseEmail }
        });

        if (existing) {
            if (existing.isActive) {
                return res.status(400).json({
                    success: false,
                    message: "This email is already subscribed"
                });
            } else {
                // Reactivate subscription
                await prisma.subscriber.update({
                    where: { email: lowercaseEmail },
                    data: {
                        isActive: true,
                        unsubscribedAt: null,
                        subscribedAt: new Date()
                    }
                });

                // Send welcome email
                try {
                    await sendWelcomeEmail(lowercaseEmail);
                } catch (error) {
                    console.error("Failed to send welcome email:", error);
                }

                return res.json({
                    success: true,
                    message: "Welcome back! Your subscription has been reactivated."
                });
            }
        }

        // Create new subscription
        await prisma.subscriber.create({
            data: {
                email: lowercaseEmail,
                source: source || 'homepage'
            }
        });

        // 🔔 Notify Admin
        try {
            notifyNewSubscriber(email);
        } catch (e) { }

        // Send welcome email
        try {
            await sendWelcomeEmail(lowercaseEmail);
        } catch (error) {
            console.error("Failed to send welcome email:", error);
        }

        res.status(201).json({
            success: true,
            message: "Thanks for subscribing! You'll receive our latest updates."
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: "This email is already subscribed"
            });
        }
        next(error);
    }
};

/**
 * 📧 Unsubscribe from newsletter (public)
 */
export const unsubscribe = async (req, res, next) => {
    try {
        const email = req.params.email.toLowerCase();

        const subscriber = await prisma.subscriber.update({
            where: { email },
            data: {
                isActive: false,
                unsubscribedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: "You have been successfully unsubscribed"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: "Email not found in our subscription list"
            });
        }
        next(error);
    }
};

/**
 * 📧 Get all subscribers (admin)
 */
export const getAllSubscribers = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;

        const where = {};
        if (status === 'active') where.isActive = true;
        if (status === 'inactive') where.isActive = false;

        const subscribers = await prisma.subscriber.findMany({
            where,
            orderBy: { subscribedAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });

        const total = await prisma.subscriber.count({ where });
        const activeCount = await prisma.subscriber.count({ where: { isActive: true } });

        res.json({
            success: true,
            data: subscribers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            stats: {
                total,
                active: activeCount,
                inactive: total - activeCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 📧 Delete subscriber (admin)
 */
export const deleteSubscriber = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.subscriber.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: "Subscriber deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: "Subscriber not found"
            });
        }
        next(error);
    }
};

/**
 * 📧 Export subscribers as CSV (admin)
 */
export const exportSubscribers = async (req, res, next) => {
    try {
        const subscribers = await prisma.subscriber.findMany({
            where: { isActive: true },
            select: { email: true, subscribedAt: true, source: true },
            orderBy: { subscribedAt: 'desc' }
        });

        const csvHeader = 'Email,Subscribed Date,Source\n';
        const csvRows = subscribers.map(s =>
            `${s.email},${s.subscribedAt.toISOString()},${s.source}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
        res.send(csvHeader + csvRows);
    } catch (error) {
        next(error);
    }
};

/**
 * 📧 Send newsletter to subscribers (admin)
 */
export const sendNewsletter = async (req, res, next) => {
    try {
        const { subject, message, recipientType = 'subscribers', recipientId } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Subject and message are required"
            });
        }

        let recipients = [];

        // Determine recipients based on type
        switch (recipientType) {
            case 'sellers':
                recipients = await prisma.user.findMany({ where: { role: 'seller' }, select: { email: true } });
                break;
            case 'customers':
                recipients = await prisma.user.findMany({ where: { role: 'customer' }, select: { email: true } });
                break;
            case 'specific':
                if (!recipientId) {
                    return res.status(400).json({
                        success: false,
                        message: "Recipient ID is required for specific targeting"
                    });
                }
                const specificUser = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } });
                if (specificUser) recipients = [specificUser];
                break;
            case 'subscribers':
            default:
                recipients = await prisma.subscriber.findMany({ where: { isActive: true }, select: { email: true } });
                break;
        }

        if (!recipients || recipients.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No active recipients found for type: ${recipientType}`
            });
        }

        // Send emails
        let successCount = 0;
        let failCount = 0;

        const { sendReportEmail } = await import("../utils/sendReportEmail.js");

        for (const recipient of recipients) {
            if (!recipient.email) continue;

            try {
                await sendReportEmail({
                    to: recipient.email,
                    subject: subject,
                    html: message
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to send newsletter to ${recipient.email}:`, err);
                failCount++;
            }
        }

        res.json({
            success: true,
            message: `Newsletter sent to ${successCount} recipients (${recipientType}). Failed: ${failCount}`,
            stats: {
                total: recipients.length,
                sent: successCount,
                failed: failCount
            }
        });
    } catch (error) {
        next(error);
    }
};
