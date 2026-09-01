import { google } from "googleapis";

/**
 * Mendapatkan OAuth2 Client Google dengan Refresh Token yang terkonfigurasi di sistem
 */
export function getGoogleOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Kredensial Google OAuth2 tidak lengkap di file environment (.env)");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

/**
 * Otomatis membuat Google Spreadsheet baru untuk form, menyusun header, dan memindahkannya ke Drive Folder
 */
export async function createFormSpreadsheet(formTitle, questions = []) {
  try {
    const auth = getGoogleOAuth2Client();
    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    // Filter soal yang nyata (bukan page break atau hidden)
    const validQuestions = (questions || []).filter(
      (q) => q && q.type !== "page_break"
    );

    const headers = [
      "Timestamp",
      ...validQuestions.map((q, idx) => q.question || `Pertanyaan ${idx + 1}`),
    ];

    const safeTitle = (formTitle || "Formulir SRE").trim();
    const sheetTitle = `${safeTitle} (Respon)`;

    // 1. Buat Spreadsheet
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: sheetTitle,
        },
        sheets: [
          {
            properties: {
              title: "Form Responses 1",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      },
    });

    const spreadsheetId = createRes.data.spreadsheetId;
    const spreadsheetUrl = createRes.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Tulis Header ke Baris 1
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Form Responses 1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers],
      },
    });

    // 3. Format Header (Bold & Background Color Emerald / Hijau SRE)
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: headers.length,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.06,
                      green: 0.73,
                      blue: 0.51,
                    },
                    textFormat: {
                      bold: true,
                      foregroundColor: {
                        red: 1,
                        green: 1,
                        blue: 1,
                      },
                      fontSize: 10,
                    },
                    horizontalAlignment: "CENTER",
                  },
                },
                fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
              },
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: "COLUMNS",
                  startIndex: 0,
                  endIndex: headers.length,
                },
              },
            },
          ],
        },
      });
    } catch (formatErr) {
      console.warn("[GoogleSheets] Optional header formatting skipped:", formatErr.message);
    }

    // 4. Pindahkan file ke Google Drive Folder (jika folder ID tersedia)
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      try {
        const file = await drive.files.get({
          fileId: spreadsheetId,
          fields: "parents",
          supportsAllDrives: true,
        });

        const previousParents = (file.data.parents || []).join(",");
        await drive.files.update({
          fileId: spreadsheetId,
          addParents: folderId,
          removeParents: previousParents,
          fields: "id, parents",
          supportsAllDrives: true,
        });
      } catch (moveErr) {
        console.warn("[GoogleSheets] Move to folder warning:", moveErr.message);
      }
    }

    // 5. Beri izin akses (anyone with link can view/edit)
    try {
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: "writer",
          type: "anyone",
        },
        supportsAllDrives: true,
      });
    } catch (permErr) {
      console.warn("[GoogleSheets] Permission setting skipped:", permErr.message);
    }

    return {
      spreadsheetId,
      spreadsheetUrl,
    };
  } catch (error) {
    console.error("[GoogleSheets] Error creating form spreadsheet:", error);
    throw error;
  }
}

/**
 * Menambahkan baris data respon form ke Google Spreadsheet secara realtime
 * Memetakan setiap jawaban secara presisi ke kolom header yang sesuai
 */
export async function appendFormResponseToSheet(spreadsheetId, payload, questions = []) {
  if (!spreadsheetId) return null;

  try {
    const auth = getGoogleOAuth2Client();
    const sheets = google.sheets({ version: "v4", auth });

    const { timestamp, answers = [] } = payload;

    // Filter soal yang nyata (bukan page break)
    const validQuestions = (questions || []).filter(
      (q) => q && q.type !== "page_break"
    );

    // 1. Ambil header aktual di baris 1 spreadsheet
    let sheetHeaders = [];
    try {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Form Responses 1!1:1",
      });
      if (headerRes.data.values && headerRes.data.values.length > 0) {
        sheetHeaders = headerRes.data.values[0] || [];
      }
    } catch (getHeaderErr) {
      console.warn("[GoogleSheets] Could not get existing headers, using defaults:", getHeaderErr.message);
    }

    // Jika spreadsheet belum memiliki header, tulis header default
    if (sheetHeaders.length === 0) {
      sheetHeaders = [
        "Timestamp",
        ...validQuestions.map((q, idx) => q.question || `Pertanyaan ${idx + 1}`),
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Form Responses 1!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [sheetHeaders],
        },
      });
    } else {
      // Periksa apakah ada pertanyaan baru yang belum ada di kolom header
      const existingHeadersLower = sheetHeaders.map((h) => (h || "").toString().trim().toLowerCase());
      const missingQuestions = validQuestions.filter((q) => {
        const titleLower = (q.question || "").trim().toLowerCase();
        return titleLower && !existingHeadersLower.includes(titleLower);
      });

      // Jika ada pertanyaan baru, perbarui baris header agar kolom bertambah secara otomatis
      if (missingQuestions.length > 0) {
        sheetHeaders = [
          ...sheetHeaders,
          ...missingQuestions.map((q, idx) => q.question || `Pertanyaan ${sheetHeaders.length + idx + 1}`),
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "Form Responses 1!A1",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [sheetHeaders],
          },
        });
      }
    }

    // 2. Buat index pencarian jawaban berdasarkan questionId & questionTitle
    const answersById = {};
    const answersByTitle = {};

    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        if (!ans) return;
        const qId = ans.questionId !== undefined && ans.questionId !== null ? String(ans.questionId) : "";
        const titleKey = (ans.questionTitle || "").trim().toLowerCase();

        let valStr = "";
        if (ans.value !== undefined && ans.value !== null) {
          if (Array.isArray(ans.value)) {
            valStr = ans.value.join(", ");
          } else if (typeof ans.value === "object") {
            valStr = JSON.stringify(ans.value);
          } else {
            valStr = String(ans.value);
          }
        }

        if (qId) answersById[qId] = valStr;
        if (titleKey) answersByTitle[titleKey] = valStr;
      });
    }

    const formattedTimestamp = new Date(timestamp || Date.now()).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "medium",
    });

    // 3. Petakan setiap nilai kolom SESUAI DENGAN HEADER di Google Sheet
    const rowValues = sheetHeaders.map((header) => {
      const headerStr = (header || "").toString().trim();
      const headerLower = headerStr.toLowerCase();

      // Kolom Timestamp / Waktu
      if (headerLower === "timestamp" || headerLower === "waktu" || headerLower === "waktu pengiriman") {
        return formattedTimestamp;
      }

      // Cari jawaban berdasarkan nama pertanyaan yang cocok dengan header
      if (answersByTitle[headerLower] !== undefined) {
        return answersByTitle[headerLower];
      }

      // Cari pertanyaan yang judulnya cocok dengan header untuk mendapatkan ID-nya
      const matchedQ = validQuestions.find(
        (q) => (q.question || "").trim().toLowerCase() === headerLower
      );
      if (matchedQ && answersById[String(matchedQ.id)] !== undefined) {
        return answersById[String(matchedQ.id)];
      }

      // Jika header adalah pertanyaan generic seperti "Pertanyaan 1", "Pertanyaan 2"
      const pertMatch = headerLower.match(/^pertanyaan\s+(\d+)$/);
      if (pertMatch) {
        const qIndex = parseInt(pertMatch[1], 10) - 1;
        const qByIndex = validQuestions[qIndex];
        if (qByIndex && answersById[String(qByIndex.id)] !== undefined) {
          return answersById[String(qByIndex.id)];
        }
      }

      return "";
    });

    // 4. Masukkan baris data ke baris berikutnya
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Form Responses 1!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowValues],
      },
    });

    return appendRes.data;
  } catch (error) {
    console.error("[GoogleSheets] Error appending response row:", error);
    return null;
  }
}
