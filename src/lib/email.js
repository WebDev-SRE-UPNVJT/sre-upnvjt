import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
export async function sendEmail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || `"SRE UPNVJT" <${process.env.EMAIL_USER}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  return info;
}
