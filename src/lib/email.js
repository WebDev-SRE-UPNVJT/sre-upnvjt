import nodemailer from "nodemailer";
import { Resend } from "resend";

// ============================================================
// EMAIL PROVIDER SWITCH
// Set RESEND_API_KEY di .env untuk pakai Resend (deliverability tinggi).
// Jika tidak ada, fallback ke SMTP (nodemailer / Gmail).
// ============================================================

/**
 * Send an email via Resend (jika RESEND_API_KEY tersedia)
 * atau via SMTP nodemailer sebagai fallback.
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @param {string} [text] - Optional plain-text fallback body
 */
export async function sendEmail({ to, subject, html, text }) {
  // --- Resend (primary, deliverability tinggi) ---
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM_RESEND || "SRE UPN Veteran Jawa Timur <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) throw new Error(error.message);
    return data;
  }

  // --- Nodemailer / Gmail SMTP (fallback) ---
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const from = process.env.EMAIL_FROM || `"SRE UPNVJT" <${process.env.EMAIL_USER}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
    headers: {
      "X-Mailer": "SRE-UPNVJT-Portal/1.0",
      "X-Priority": "3",
      "Precedence": "bulk",
      "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
    },
  });

  return info;
}
