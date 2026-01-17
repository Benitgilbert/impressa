import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";
import { notifyNewSubscriber } from "./notificationController.js";
import { sendWelcomeEmail } from "../utils/emailService.js";

/**
 * Subscribe to newsletter (public)
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

        // Check if already subscribed
        const existing = await Subscriber.findOne({ email: email.toLowerCase() });

        if (existing) {
            if (existing.isActive) {
                return res.status(400).json({
                    success: false,
                    message: "This email is already subscribed"
                });
            } else {
                // Reactivate subscription
                existing.isActive = true;
                existing.unsubscribedAt = null;
                existing.subscribedAt = new Date();
                await existing.save();

                // Send welcome email
                try {
                    await sendWelcomeEmail(email.toLowerCase());
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
        await Subscriber.create({
            email: email.toLowerCase(),
            source: source || 'homepage'
        });

        // 🔔 Notify Admin
        try {
            notifyNewSubscriber(email);
        } catch (e) { }

        // Send welcome email
        try {
            await sendWelcomeEmail(email.toLowerCase());
        } catch (error) {
            console.error("Failed to send welcome email:", error);
        }

        res.status(201).json({
            success: true,
            message: "Thanks for subscribing! You'll receive our latest updates."
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "This email is already subscribed"
            });
        }
        next(error);
    }
};

/**
 * Unsubscribe from newsletter (public)
 */
export const unsubscribe = async (req, res, next) => {
    try {
        const { email } = req.params;

        const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: "Email not found in our subscription list"
            });
        }

        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        res.json({
            success: true,
            message: "You have been successfully unsubscribed"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all subscribers (admin)
 */
export const getAllSubscribers = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;

        const subscribers = await Subscriber.find(filter)
            .sort({ subscribedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Subscriber.countDocuments(filter);
        const activeCount = await Subscriber.countDocuments({ isActive: true });

        res.json({
            success: true,
            data: subscribers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
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
 * Delete subscriber (admin)
 */
export const deleteSubscriber = async (req, res, next) => {
    try {
        const { id } = req.params;

        const subscriber = await Subscriber.findByIdAndDelete(id);

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: "Subscriber not found"
            });
        }

        res.json({
            success: true,
            message: "Subscriber deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Export subscribers as CSV (admin)
 */
export const exportSubscribers = async (req, res, next) => {
    try {
        const subscribers = await Subscriber.find({ isActive: true })
            .select('email subscribedAt source')
            .sort({ subscribedAt: -1 });

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
 * Send newsletter to subscribers (admin)
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
                recipients = await User.find({ role: 'seller' }).select('email');
                break;
            case 'customers':
                recipients = await User.find({ role: 'customer' }).select('email');
                break;
            case 'specific':
                if (!recipientId) {
                    return res.status(400).json({
                        success: false,
                        message: "Recipient ID is required for specific targeting"
                    });
                }
                const specificUser = await User.findById(recipientId).select('email');
                if (specificUser) recipients = [specificUser];
                break;
            case 'subscribers':
            default:
                recipients = await Subscriber.find({ isActive: true }).select('email');
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
