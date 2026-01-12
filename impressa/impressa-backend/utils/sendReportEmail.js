import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendReportEmail = async ({ to, subject, text, html, attachmentPath }) => {
  try {
    const emailData = {
      from: 'Impressa <noreply@impressa.rw>',
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