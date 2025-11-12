import express from "express";
import { google } from "googleapis";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🧾 Load Google Service Account
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES
);

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = "1GbJnrB2dTeOdQkNirDW_081aEB_shsENPoDh2LRj_v4"; // ✅ your sheet ID

// 🩺 Health Check
app.get("/", (req, res) => {
  res.send("✅ Voter List Backend is running with two-way sync!");
});

// 🧾 Sync multiple residents → write to Sheet
app.post("/sync-residents", async (req, res) => {
  try {
    const rows = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const values = rows.map((r) => [
      r.serialNo || "",
      r.name || "",
      r.guardianName || "",
      r.wardHouseNo || "",
      r.houseName || "",
      r.genderAge || "",
      r.mobileNumber || "",
      r.phoneNumber || "",
      r.visitCount || 0,
      r.category || "",
      r.remark || "",
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A2:K",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    res.status(500).json({ error: "Failed to sync residents" });
  }
});

// 🧠 Fetch all data from Google Sheet → send to frontend
app.get("/fetch-residents", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A2:K",
    });

    const rows = response.data.values || [];
    const residents = rows.map((row, i) => ({
      id: `resident-${i}`,
      serialNo: row[0] || "",
      name: row[1] || "",
      guardianName: row[2] || "",
      wardHouseNo: row[3] || "",
      houseName: row[4] || "",
      genderAge: row[5] || "",
      mobileNumber: row[6] || "",
      phoneNumber: row[7] || "",
      visitCount: Number(row[8]) || 0,
      category: row[9] || "",
      remark: row[10] || "",
    }));

    res.json({ success: true, residents });
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch residents from Google Sheet" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
