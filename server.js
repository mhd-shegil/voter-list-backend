import express from "express";
import { google } from "googleapis";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Load service account credentials
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES
);

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1GbJnrB2dTeOdQkNirDW_081aEB_shsENPoDh2LRj_v4"; // Replace with your Sheet ID

// 🧾 Endpoint to add a new resident row
app.post("/add-resident", async (req, res) => {
  const { name, guardian, ward, phone, category, remark, visit } = req.body;

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[Date.now(), name, guardian, ward, phone, category, remark, visit]],
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add resident" });
  }
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
