/**
 * Branded email template for SRE UPNVJT password reset
 */
export function getPasswordResetEmailHtml({ name, resetUrl, expiryMinutes = 60 }) {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Password - SRE UPNVJT</title>
</head>
<body style="margin:0;padding:0;background-color:#0a1c15;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1c15;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#14532d,#166534);border-radius:16px;padding:20px 32px;">
                    <p style="margin:0;font-size:22px;font-weight:900;color:#e8ecc4;letter-spacing:-0.5px;">
                      SRE<span style="color:#84cc16;"> ·</span> UPN Veteran Jawa Timur
                    </p>
                    <p style="margin:4px 0 0;font-size:11px;color:#86efac;text-transform:uppercase;letter-spacing:2px;">Society of Renewable Energy</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#0d2318;border:1px solid #1a3a2a;border-radius:20px;overflow:hidden;">

              <!-- Accent bar -->
              <div style="height:4px;background:linear-gradient(90deg,#16a34a,#eab308,#16a34a);"></div>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <!-- Icon -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background-color:#14532d;border-radius:50%;width:56px;height:56px;text-align:center;vertical-align:middle;">
                          <span style="font-size:26px;line-height:56px;">🔐</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f0fdf4;letter-spacing:-0.5px;">
                      Reset Password Akun
                    </h1>
                    <p style="margin:0 0 24px;font-size:14px;color:#86efac;font-weight:500;">
                      Permintaan reset password diterima
                    </p>

                    <!-- Greeting -->
                    <p style="margin:0 0 20px;font-size:15px;color:#bbf7d0;line-height:1.7;">
                      Halo <strong style="color:#e8ecc4;">${name || "Pengguna"}</strong>,
                    </p>
                    <p style="margin:0 0 32px;font-size:15px;color:#86efac;line-height:1.7;">
                      Kami menerima permintaan untuk mereset password akun SRE UPNVJT Anda. Klik tombol di bawah untuk melanjutkan. Link ini hanya berlaku selama <strong style="color:#fde047;">${expiryMinutes} menit</strong>.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                      <tr>
                        <td style="background-color:#eab308;border-radius:50px;">
                          <a href="${resetUrl}"
                             target="_blank"
                             style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:800;color:#0a1c15;text-decoration:none;letter-spacing:0.5px;border-radius:50px;">
                            RESET PASSWORD SEKARANG →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Warning -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a2e1a;border-left:3px solid #eab308;border-radius:0 8px 8px 0;margin-bottom:28px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0;font-size:13px;color:#fde047;font-weight:600;">⚠️ Jangan bagikan link ini kepada siapapun</p>
                          <p style="margin:4px 0 0;font-size:12px;color:#86efac;line-height:1.6;">
                            Tim SRE UPNVJT tidak akan pernah meminta link reset password Anda.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Not you? -->
                    <p style="margin:0;font-size:13px;color:#4ade80;line-height:1.7;">
                      Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
                    </p>

                  </td>
                </tr>

                <!-- Link fallback -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#374151;">Jika tombol tidak berfungsi, salin link ini ke browser:</p>
                    <p style="margin:0;font-size:11px;color:#16a34a;word-break:break-all;">${resetUrl}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 4px;font-size:12px;color:#374151;">
                © ${new Date().getFullYear()} Society of Renewable Energy — UPN Veteran Jawa Timur
              </p>
              <p style="margin:0;font-size:11px;color:#1f2937;">
                Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Industrial-standard, beautifully branded onboarding & credentials announcement email template for SRE UPNVJT members
 */
export function getMemberOnboardingEmailHtml({
  name,
  email,
  password = "memberSRE2026",
  npm = "-",
  role = "MEMBER",
  loginUrl = "https://sreupnjatim.com/login",
}) {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Aktivasi Akun Member - SRE UPN Veteran Jawa Timur</title>
</head>
<body style="margin:0;padding:0;background-color:#06140e;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#06140e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:linear-gradient(135deg,#064e3b 0%,#047857 50%,#059669 100%);border-radius:14px;padding:16px 28px;text-align:center;box-shadow:0 8px 24px rgba(5,150,105,0.25);">
                    <p style="margin:0;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                      SRE<span style="color:#a7f3d0;"> ·</span> UPN Veteran Jawa Timur
                    </p>
                    <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#d1fae5;text-transform:uppercase;letter-spacing:2.5px;">
                      Society of Renewable Energy
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="background-color:#0b1f16;border:1px solid #16402d;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
              
              <!-- Gradient Top Bar -->
              <div style="height:4px;background:linear-gradient(90deg,#10b981 0%,#f59e0b 50%,#10b981 100%);"></div>

              <!-- Content Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 36px 28px;">

                    <!-- Badge -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="background-color:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:6px 14px;">
                          <p style="margin:0;font-size:11px;font-weight:800;color:#34d399;text-transform:uppercase;letter-spacing:1.5px;">
                            🎉 Official Member Onboarding
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Header Title -->
                    <h1 style="margin:0 0 10px;font-size:23px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.3;">
                      Selamat Bergabung di SRE UPN Veteran Jawa Timur!
                    </h1>
                    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;font-weight:500;line-height:1.6;">
                      Akun Member Portal Anda telah berhasil dibuat dan siap untuk digunakan.
                    </p>

                    <!-- Personalized Greeting -->
                    <p style="margin:0 0 16px;font-size:15px;color:#e2e8f0;line-height:1.7;">
                      Halo <strong style="color:#34d399;font-weight:800;">${name || "Member SRE"}</strong>,
                    </p>
                    <p style="margin:0 0 28px;font-size:14px;color:#cbd5e1;line-height:1.7;">
                      Selamat atas bergabungnya Anda di organisasi <strong>Society of Renewable Energy (SRE) UPN Veteran Jawa Timur</strong>. Melalui portal ini, Anda dapat mengakses penugasan (Quest & Misi), leaderboard, materi literasi EBT, dan aktivitas organisasi.
                    </p>

                    <!-- Credentials Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#071610;border:1px solid #1a4d36;border-radius:12px;margin-bottom:28px;overflow:hidden;">
                      <tr>
                        <td style="padding:18px 22px;border-bottom:1px solid #133a28;background-color:rgba(5,150,105,0.08);">
                          <p style="margin:0;font-size:12px;font-weight:800;color:#34d399;text-transform:uppercase;letter-spacing:1px;">
                            📋 Kredensial Akun Anda
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 22px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:6px 0;width:38%;font-size:13px;color:#64748b;font-weight:600;">Nama Lengkap</td>
                              <td style="padding:6px 0;font-size:13px;color:#f1f5f9;font-weight:700;">${name}</td>
                            </tr>
                            ${npm && npm !== "-" ? `
                            <tr>
                              <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;">NPM / Identitas</td>
                              <td style="padding:6px 0;font-size:13px;color:#f1f5f9;font-family:monospace;font-weight:700;">${npm}</td>
                            </tr>
                            ` : ""}
                            <tr>
                              <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;">Email Akun</td>
                              <td style="padding:6px 0;font-size:13px;color:#38bdf8;font-weight:700;word-break:break-all;">${email}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;">Password Default</td>
                              <td style="padding:6px 0;">
                                <span style="display:inline-block;background-color:#1e293b;border:1px solid #334155;color:#facc15;padding:4px 10px;border-radius:6px;font-family:monospace;font-size:13px;font-weight:800;letter-spacing:0.5px;">
                                  ${password}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;">Role Akses</td>
                              <td style="padding:6px 0;">
                                <span style="display:inline-block;background-color:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:800;letter-spacing:1px;">
                                  ${role}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Button CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                              <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:8px;box-shadow:0 6px 20px rgba(16,185,129,0.35);">
                                <a href="${loginUrl}"
                                   target="_blank"
                                   style="display:inline-block;padding:15px 38px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
                                  MASUK KE PORTAL MEMBER →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Alert (Change Password Step) -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#172216;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 4px;font-size:13px;color:#fbbf24;font-weight:800;">
                            🔒 Langkah Penting: Ganti Password Anda
                          </p>
                          <p style="margin:0;font-size:12.5px;color:#cbd5e1;line-height:1.6;">
                            Untuk melindungi akun Anda, silakan login lalu buka menu <strong>Profil → Edit Member Profile</strong> untuk mengganti password default dengan password pribadi Anda.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Portal Features Highlight -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-top:1px solid #16402d;padding-top:24px;">
                      <tr>
                        <td>
                          <p style="margin:0 0 14px;font-size:13px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
                            Fitur Utama di Portal Member:
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:6px 0;font-size:13px;color:#cbd5e1;line-height:1.5;">
                                🎯 <strong>Quest & Misi</strong>: Selesaikan Main Quest & Side Quest untuk mengumpulkan XP.
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;font-size:13px;color:#cbd5e1;line-height:1.5;">
                                🏆 <strong>Leaderboard</strong>: Pantau perolehan XP dan ranking keanggotaan Anda.
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;font-size:13px;color:#cbd5e1;line-height:1.5;">
                                🧩 <strong>TTS & Tantangan EBT</strong>: Tingkatkan wawasan energi baru terbarukan.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Direct Link Fallback -->
                <tr>
                  <td style="padding:0 36px 28px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#64748b;">Jika tombol di atas tidak dapat diklik, salin URL berikut ke browser Anda:</p>
                    <p style="margin:0;font-size:12px;color:#10b981;word-break:break-all;font-family:monospace;">${loginUrl}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#64748b;">
                Society of Renewable Energy — UPN Veteran Jawa Timur
              </p>
              <p style="margin:0 0 10px;font-size:11px;color:#475569;">
                Website: <a href="https://sreupnjatim.com" target="_blank" style="color:#10b981;text-decoration:none;">sreupnjatim.com</a> &nbsp;|&nbsp; Email: <a href="mailto:webdev.sre.upnvjt@gmail.com" style="color:#10b981;text-decoration:none;">webdev.sre.upnvjt@gmail.com</a>
              </p>
              <p style="margin:0;font-size:10.5px;color:#334155;">
                Email ini dikirimkan secara otomatis kepada member resmi SRE UPN Veteran Jawa Timur.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
