import nodemailer from "nodemailer";
import { renderTemplate } from "./emailTemplate.js";

/**
 * Centralized Email Service
 * Handles all transactional emails for the platform
 */

// Create transporter (configure in .env)
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const sendEmail = async ({ to, subject, text, html, headers }) => {
    try {
        const transporter = createTransporter();

        // Ensure "Impressa" is always in the From field
        let from = process.env.SMTP_FROM || "Impressa <noreply@impressa.rw>";
        if (!from.includes("Impressa") && !from.includes('"')) {
            from = `"Impressa" <${process.env.SMTP_USER || from}>`;
        }

        const mailOptions = {
            from,
            to,
            subject,
            text,
            html,
            headers // Support for custom headers from arguments
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`[Email] Sent to ${to}: ${subject}`);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`[Email] Failed to send to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Email Templates
 */

// Seller Approved
export const sendSellerApprovedEmail = async (seller) => {
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">🎉 Congratulations! Your Seller Account is Approved</h2>
        <p>Hi ${seller.name},</p>
        <p>Great news! Your seller application for <strong>${seller.storeName}</strong> has been approved.</p>
        <p>You can now:</p>
        <ul>
            <li>List and sell products on our marketplace</li>
            <li>Manage orders and track earnings</li>
            <li>Receive payouts to your registered account</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/seller/dashboard" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Go to Seller Dashboard
        </a>
        <p style="color: #6b7280; margin-top: 24px;">Welcome to the Impressa family!</p>
    </div>`;

    return sendEmail({
        to: seller.email,
        subject: "🎉 Your Seller Account is Approved - Impressa",
        html
    });
};

// Seller Rejected
export const sendSellerRejectedEmail = async (seller, reason) => {
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">Seller Application Update</h2>
        <p>Hi ${seller.name},</p>
        <p>We've reviewed your seller application for <strong>${seller.storeName || 'your store'}</strong>.</p>
        <p>Unfortunately, we are unable to approve your application at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>You may reapply after addressing the concerns mentioned above.</p>
        <p style="color: #6b7280; margin-top: 24px;">— The Impressa Team</p>
    </div>`;

    return sendEmail({
        to: seller.email,
        subject: "Seller Application Update - Impressa",
        html
    });
};

// Product Approved
export const sendProductApprovedEmail = async (seller, product) => {
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ Product Approved</h2>
        <p>Hi ${seller.name},</p>
        <p>Your product <strong>"${product.name}"</strong> has been approved and is now live on the marketplace.</p>
        <a href="${process.env.FRONTEND_URL}/product/${product.slug}" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            View Product
        </a>
    </div>`;

    return sendEmail({
        to: seller.email,
        subject: `✅ Product Approved: ${product.name} - Impressa`,
        html
    });
};

// New Order Notification
export const sendNewOrderEmail = async (seller, order) => {
    const sellerItems = order.items.filter(item =>
        item.seller && item.seller.toString() === seller._id.toString()
    );
    const total = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">🛒 New Order Received!</h2>
        <p>Hi ${seller.name},</p>
        <p>You have a new order to fulfill!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
            <p><strong>Items:</strong> ${sellerItems.length}</p>
            <p><strong>Total:</strong> ${total.toLocaleString()} RWF</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/seller/orders/${order._id}" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Order Details
        </a>
        <p style="color: #6b7280; margin-top: 24px;">Please fulfill this order within 48 hours.</p>
    </div>`;

    return sendEmail({
        to: seller.email,
        subject: `🛒 New Order: ${order.orderNumber || order._id} - Impressa`,
        html
    });
};

// Payout Sent
export const sendPayoutSentEmail = async (seller, payout) => {
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">💰 Payout Processed</h2>
        <p>Hi ${seller.name},</p>
        <p>Your payout has been processed successfully!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Payout ID:</strong> ${payout.payoutId}</p>
            <p><strong>Amount:</strong> ${payout.amount.toLocaleString()} RWF</p>
            <p><strong>Commission:</strong> ${payout.platformFee.toLocaleString()} RWF (${payout.commissionRate}%)</p>
            <p><strong>Payment Method:</strong> ${payout.paymentMethod}</p>
        </div>
        <p>The funds should reflect in your account within 1-3 business days.</p>
    </div>`;

    return sendEmail({
        to: seller.email,
        subject: `💰 Payout Processed: ${payout.amount.toLocaleString()} RWF - Impressa`,
        html
    });
};

// Warning Notice
export const sendWarningEmail = async (seller, violation) => {
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">⚠️ Seller Account Warning</h2>
        <p>Hi ${seller.name},</p>
        <p>We've detected an issue with your seller account that requires attention.</p>
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Issue:</strong> ${violation.type.replace(/_/g, ' ').toUpperCase()}</p>
            <p><strong>Details:</strong> ${violation.description}</p>
        </div>
        <p>Please address this issue to avoid further action on your account.</p>
        <a href="${process.env.FRONTEND_URL}/seller/account" 
           style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Review Account
        </a>
    </div>`;

    return sendEmail({
        to: seller.email,
        subject: "⚠️ Seller Account Warning - Impressa",
        html
    });
};

// Low Stock Alert
export const sendLowStockEmail = async (seller, products) => {
    const productList = products.map(p =>
        `<li><strong>${p.name}</strong> - ${p.stock} remaining</li>`
    ).join('');

    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">📦 Low Stock Alert</h2>
        <p>Hi ${seller.name},</p>
        <p>The following products are running low on stock:</p>
        <ul style="background: #f3f4f6; padding: 16px 32px; border-radius: 8px;">
            ${productList}
        </ul>
        <p>Consider restocking to avoid missing sales.</p>
        <a href="${process.env.FRONTEND_URL}/seller/products" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Manage Inventory
        </a>
    </div>`;

    return sendEmail({
        to: seller.email,
        subject: "📦 Low Stock Alert - Impressa",
        html
    });
};

// Welcome Newsletter Subscriber
export const sendWelcomeEmail = async (email) => {
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`;

    const headers = {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${process.env.SMTP_USER || 'noreply@impressa.rw'}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };

    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Impressa! 🎉</h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi there,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Thank you so much for subscribing to the Impressa newsletter! We're thrilled to have you join our community of creative minds and printing enthusiasts.
            </p>

            <div style="background-color: #f3f4f6; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="color: #111827; margin-top: 0; margin-bottom: 16px; font-size: 18px;">What to expect:</h3>
                <ul style="color: #4b5563; font-size: 15px; line-height: 1.6; padding-left: 20px; margin: 0;">
                    <li style="margin-bottom: 8px;">💡 Expert printing tips and design guides</li>
                    <li style="margin-bottom: 8px;">🚀 Platform updates and new features</li>
                    <li style="margin-bottom: 8px;">🌟 Seller success stories and spotights</li>
                    <li style="margin-bottom: 0;">🎁 Exclusive subscriber-only deals</li>
                </ul>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Stay tuned for our next update. In the meantime, explore our latest blog posts or browse the marketplace for inspiration!
            </p>

            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/blog" 
                   style="display: inline-block; background-color: #ef4444; color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 32px; text-decoration: none; border-radius: 50px; transition: background-color 0.3s ease; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.25);">
                    Read the Blog
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                © ${new Date().getFullYear()} Impressa. All rights reserved.<br>
                This email was sent to <a href="mailto:${email}" style="color: #9ca3af; text-decoration: none;">${email}</a>
            </p>
            <div style="margin-top: 12px;">
                <a href="${process.env.FRONTEND_URL}" style="color: #6366f1; text-decoration: none; font-size: 13px; margin: 0 8px;">Website</a>
                <span style="color: #d1d5db;">|</span>
                <a href="${process.env.FRONTEND_URL}/contact" style="color: #6366f1; text-decoration: none; font-size: 13px; margin: 0 8px;">Contact Us</a>
                <span style="color: #d1d5db;">|</span>
                <a href="${unsubscribeUrl}" style="color: #6366f1; text-decoration: none; font-size: 13px; margin: 0 8px;">Unsubscribe</a>
            </div>
        </div>
    </div>`;

    return sendEmail({
        to: email,
        subject: "Welcome to the Impressa Community! 💌",
        html,
        headers
    });
};

export default {
    sendEmail,
    sendSellerApprovedEmail,
    sendSellerRejectedEmail,
    sendProductApprovedEmail,
    sendNewOrderEmail,
    sendPayoutSentEmail,
    sendWarningEmail,
    sendLowStockEmail,
    sendWelcomeEmail
};
