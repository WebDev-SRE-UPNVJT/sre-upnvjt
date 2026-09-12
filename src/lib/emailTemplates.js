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
