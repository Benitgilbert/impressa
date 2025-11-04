import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP config
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReportEmail = async ({ to, subject, text, attachmentPath }) => {
  const mailOptions = {
    from: '"impressa Reports" <reports@impressa.com>',
    to,
    subject,
    text,
    attachments: attachmentPath
      ? [{ filename: "report.pdf", path: attachmentPath }]
      : [],
  };

  await transporter.sendMail(mailOptions);
};

export default sendReportEmail;