import { Resend } from 'resend';

// Initialize Resend with API key (with fallback if not set)
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠️  RESEND_API_KEY not set. Email functionality will be disabled.');
}

export const sendReportEmail = async ({ to, subject, text, html, attachmentPath }) => {
  try {
    if (!resend) {
      console.warn('⚠️  Resend not configured. Skipping email.');
      return;
    }

    const emailData = {
      from: 'Impressa <onboarding@resend.dev>',
      to,
      subject,
      html: html || `<p>${text}</p>`, // Use HTML if provided, otherwise wrap text in <p>
    };

    // Resend doesn't support attachments in the same way as nodemailer
    // For now, we'll skip attachments or handle them separately
    // TODO: If you need PDF attachments, consider using a different approach

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("❌ Failed to send email:", error);
      throw error;
    }

    console.log("✅ Email sent successfully:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

export default sendReportEmail;