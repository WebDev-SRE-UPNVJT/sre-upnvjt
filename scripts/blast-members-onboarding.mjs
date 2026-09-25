import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { getMemberOnboardingEmailHtml } from "../src/lib/emailTemplates.js";

dotenv.config();

/**
 * Delay helper for rate limiting to prevent getting blocked by SMTP provider
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Daftar member yang akan diblast.
 * Anda dapat mengganti/menyesuaikan daftar ini atau mengimpor file json/csv.
 */
const sampleMembersList = [
  { no: 1, name: "Nanda Fitri Oktalia", email: "25031010189@student.upnjatim.ac.id", npm: "25031010189", password: "memberSRE2026", role: "MEMBER" },
  { no: 2, name: "Mifta Laila fauziah", email: "25031010062@student.upnjatim.ac.id", npm: "25031010062", password: "memberSRE2026", role: "MEMBER" },
  { no: 3, name: "Luky Oktavian Ramadhan", email: "24035010041@student.upnjatim.ac.id", npm: "24035010041", password: "memberSRE2026", role: "MEMBER" },
  { no: 4, name: "Salwa Enggita Ainurochma", email: "25033010092@student.upnjatim.ac.id", npm: "25033010092", password: "memberSRE2026", role: "MEMBER" },
  { no: 5, name: "Amanda Rosyidah Azaria", email: "25042010171@student.upnjatim.ac.id", npm: "25042010171", password: "memberSRE2026", role: "MEMBER" },
  { no: 6, name: "Mohammad Athif Ayyasi Adnani", email: "25036010078@student.upnjatim.ac.id", npm: "25036010078", password: "memberSRE2026", role: "MEMBER" },
  { no: 7, name: "Sherly Anastasya Fidiawati", email: "25042010140@student.upnjatim.ac.id", npm: "25042010140", password: "memberSRE2026", role: "MEMBER" },
  { no: 8, name: "Jingga Putri Ayuningtias", email: "25043010225@student.upnjatim.ac.id", npm: "25043010225", password: "memberSRE2026", role: "MEMBER" },
  { no: 9, name: "Zanifa Alya Felisha", email: "25052010014@student.upnjatim.ac.id", npm: "25052010014", password: "memberSRE2026", role: "MEMBER" },
  { no: 10, name: "Difa Isalili Rahmadatul Kimayah", email: "24011010154@student.upnjatim.ac.id", npm: "24011010154", password: "memberSRE2026", role: "MEMBER" },
  { no: 11, name: "Michel Rachel Tri Setiawati", email: "24025010213@student.upnjatim.ac.id", npm: "24025010213", password: "memberSRE2026", role: "MEMBER" },
  { no: 12, name: "Naila Chaitra Putri", email: "24033010036@student.upnjatim.ac.id", npm: "24033010036", password: "memberSRE2026", role: "MEMBER" },
  { no: 13, name: "Amanda Augusta Putri", email: "25011010008@student.upnjatim.ac.id", npm: "25011010008", password: "memberSRE2026", role: "MEMBER" },
  { no: 14, name: "Zahra Salsabila Yasmin", email: "26013010288@student.upnjatim.ac.id", npm: "26013010288", password: "memberSRE2026", role: "MEMBER" },
  { no: 15, name: "Savika Agis Triandika", email: "25034010126@student.upnjatim.ac.id", npm: "25034010126", password: "memberSRE2026", role: "MEMBER" },
  { no: 16, name: "Muhammad Ibnu Khoiri Hidayat", email: "25036010054@student.upnjatim.ac.id", npm: "25036010054", password: "memberSRE2026", role: "MEMBER" },
  { no: 17, name: "Beylla Eka Kirana", email: "25031010095@student.upnjatim.ac.id", npm: "25031010095", password: "memberSRE2026", role: "MEMBER" },
  { no: 18, name: "Lorenza Hutapea", email: "25032010064@student.upnjatim.ac.id", npm: "25032010064", password: "memberSRE2026", role: "MEMBER" },
  { no: 19, name: "Putri Mufida Azzahra", email: "24031010256@student.upnjatim.ac.id", npm: "24031010256", password: "memberSRE2026", role: "MEMBER" },
  { no: 20, name: "Christian Ferry Hartono", email: "25032010273@student.upnjatim.ac.id", npm: "25032010273", password: "memberSRE2026", role: "MEMBER" },
  { no: 21, name: "Nadia Zahra", email: "24031010238@student.upnjatim.ac.id", npm: "24031010238", password: "memberSRE2026", role: "MEMBER" },
  { no: 22, name: "Nayla Sabrina", email: "25042010120@student.upnjatim.ac.id", npm: "25042010120", password: "memberSRE2026", role: "MEMBER" },
  { no: 23, name: "Dwi Ayu Wardini Arianti", email: "24031010200@student.upnjatim.ac.id", npm: "24031010200", password: "memberSRE2026", role: "MEMBER" },
  { no: 24, name: "M. Ananda Hariadi", email: "24081010023@student.upnjatim.ac.id", npm: "24081010023", password: "memberSRE2026", role: "MEMBER" },
  { no: 25, name: "Shyfa Novirna", email: "25012010413@student.upnjatim.ac.id", npm: "25012010413", password: "memberSRE2026", role: "MEMBER" },
];

async function blastEmails({ isDryRun = true } = {}) {
  console.log(`\n📬 =================================================`);
  console.log(`   SRE UPNVJT MEMBER ONBOARDING EMAIL BLAST`);
  console.log(`   Mode: ${isDryRun ? "🧪 DRY RUN (Simulation only)" : "🔥 LIVE SENDING"}`);
  console.log(`   Total Recipients: ${sampleMembersList.length}`);
  console.log(`=================================================\n`);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const from = process.env.EMAIL_FROM || `"SRE UPN Veteran Jawa Timur" <${process.env.EMAIL_USER}>`;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < sampleMembersList.length; i++) {
    const member = sampleMembersList[i];
    const progress = `[${i + 1}/${sampleMembersList.length}]`;

    console.log(`${progress} Processing: ${member.name} (${member.email})...`);

    if (isDryRun) {
      console.log(`   ✅ [DRY RUN] Generated email HTML for ${member.email}`);
      successCount++;
    } else {
      try {
        const html = getMemberOnboardingEmailHtml({
          name: member.name,
          email: member.email,
          password: member.password || "memberSRE2026",
          npm: member.npm,
          role: member.role || "MEMBER",
          loginUrl: "https://sreupnjatim.com/login",
        });

        const info = await transporter.sendMail({
          from,
          to: member.email,
          subject: "🎉 Selamat Bergabung di SRE UPN Veteran Jawa Timur - Akses Akun Portal Member",
          html,
        });

        console.log(`   ✅ Sent! ID: ${info.messageId}`);
        successCount++;

        // Delay 1.5 seconds between sends to respect Gmail SMTP sending limits
        await sleep(1500);
      } catch (err) {
        console.error(`   ❌ Failed to send to ${member.email}:`, err.message);
        failCount++;
      }
    }
  }

  console.log(`\n🎉 Blast completed! Success: ${successCount}, Failed: ${failCount}`);
}

// Jalankan script
// Kirim argument --live untuk mode live send, default adalah dry-run
const isLive = process.argv.includes("--live");
blastEmails({ isDryRun: !isLive });
