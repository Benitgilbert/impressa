import { Resend } from 'resend';

// Initialize Resend with API key (with fallback if not set)
let resend = null;

if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
} else {
    console.warn('⚠️  RESEND_API_KEY not set. Email functionality will be disabled.');
}

export const sendOrderConfirmation = async (order) => {
    try {
        if (!resend) {
            console.warn('⚠️  Resend not configured. Skipping order confirmation email.');
            return;
        }

        const { data, error } = await resend.emails.send({
            from: 'Impressa <onboarding@resend.dev>',
            to: order.guestInfo?.email || order.customer?.email,
            subject: `Order Confirmation #${order.publicId}`,
            html: `
        <h1>Thank you for your order!</h1>
        <p>Hi ${order.guestInfo?.name || order.customer?.name || 'Customer'},</p>
        <p>We have received your order <strong>#${order.publicId}</strong>.</p>
        <p><strong>Total:</strong> ${order.totals.grandTotal} Rwf</p>
        <p>We will notify you when your items are shipped.</p>
      `,
        });

        if (error) {
            console.error("❌ Failed to send order confirmation:", error);
            return;
        }

        console.log("✅ Order Confirmation Sent:", data.id);
    } catch (error) {
        console.error("❌ Failed to send order confirmation:", error);
    }
};

export const sendStatusUpdate = async (order) => {
    try {
        if (!resend) {
            console.warn('⚠️  Resend not configured. Skipping status update email.');
            return;
        }

        const { data, error } = await resend.emails.send({
            from: 'Impressa <onboarding@resend.dev>',
            to: order.guestInfo?.email || order.customer?.email,
            subject: `Order Update #${order.publicId}`,
            html: `
        <h1>Order Update</h1>
        <p>Hi ${order.guestInfo?.name || order.customer?.name || 'Customer'},</p>
        <p>Your order <strong>#${order.publicId}</strong> status has been updated to: <strong>${order.status.toUpperCase()}</strong>.</p>
      `,
        });

        if (error) {
            console.error("❌ Failed to send status update:", error);
            return;
        }

        console.log("✅ Status Update Email Sent:", data.id);
    } catch (error) {
        console.error("❌ Failed to send status update:", error);
    }
};
