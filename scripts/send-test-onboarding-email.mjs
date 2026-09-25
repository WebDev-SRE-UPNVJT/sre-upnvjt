import dotenv from "dotenv";
import { Resend } from "resend";
import { getMemberOnboardingEmailHtml } from "../src/lib/emailTemplates.js";

dotenv.config();

async function sendTestEmail() {
  const targetEmail = "iftitahnas@gmail.com";
  const member = {
    name: "Azizah",
    email: targetEmail,
    password: "memberSRE2026",
    npm: "-",
    role: "MEMBER",
    loginUrl: "https://sreupnjatim.com/login",
  };

  console.log(`\n🚀 Sending onboarding email via Resend to ${targetEmail}...`);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const htmlContent = getMemberOnboardingEmailHtml(member);
  const from = process.env.EMAIL_FROM_RESEND || "SRE UPN Veteran Jawa Timur <noreply@sreupnjatim.com>";

  const textContent = `
Halo ${member.name},

Selamat bergabung di Society of Renewable Energy (SRE) UPN Veteran Jawa Timur!

Akun Member Portal Anda telah berhasil dibuat. Berikut adalah kredensial login Anda:

  Nama Lengkap : ${member.name}
  Email        : ${member.email}
  Password     : ${member.password}
  Role         : ${member.role}

Silakan login melalui: ${member.loginUrl}

PENTING: Segera ganti password default Anda setelah login pertama kali melalui menu Profil > Edit Member Profile.

---
Society of Renewable Energy - UPN Veteran Jawa Timur
Website: https://sreupnjatim.com
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: targetEmail,
      subject: "Aktivasi Akun Member - SRE UPN Veteran Jawa Timur",
      html: htmlContent,
      text: textContent,
    });

    if (error) throw new Error(JSON.stringify(error));

    console.log("✅ Email sent via Resend!");
    console.log("   From:", from);
    console.log("   To:", targetEmail);
    console.log("   Email ID:", data.id);
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

sendTestEmail();
