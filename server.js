import express from "express";
import { google } from "googleapis";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🧾 Load service account credentials from Render environment
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES
);

const sheets = google.sheets({ version: "v4", auth });

// ✅ Replace with your actual Google Sheet ID
const SPREADSHEET_ID = "1GbJnrB2dTeOdQkNirDW_081aEB_shsENPoDh2LRj_v4";

// 🧩 Health Check Route
app.get("/", (req, res) => {
  res.send("✅ Voter List Backend is running!");
});

// 🧾 Add a single resident (for individual entry)
app.post("/add-resident", async (req, res) => {
  const { name, guardian, ward, phone, category, remark, visit } = req.body;

  try {
    const values = [[Date.now(), name, guardian, ward, phone, category, remark, visit]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    res.json({ success: true, message: "Resident added successfully!" });
  } catch (err) {
    console.error("❌ Error adding resident:", err);
    res.status(500).json({ error: "Failed to add resident" });
  }
});

// 🔄 Sync multiple residents (for full upload/export sync)
app.post("/sync-residents", async (req, res) => {
  try {
    const rows = req.body;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    console.log(`📤 Syncing ${rows.length} residents to Google Sheets...`);

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

    console.log("✅ Sync complete!");
    res.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    res.status(500).json({ error: "Failed to sync residents" });
  }
});

// ⚙️ Dynamic Port for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
