# DataLake

# Purpose
Automates daily data gathering for NAHS and NAMS campuses. Monitors Gmail labels for scheduled Cognos report emails, extracts the Excel attachments, and updates a central Google Spreadsheet that acts as a data API for downstream campus projects. Also supports manual data push from the central spreadsheet to target criteria sheets via a spreadsheet menu.

# Status
Active. Automated email processing runs every weekday at 5:00 AM. Two manual push features (Allergies, Entry_Withdrawal) are temporarily disabled but remain in the codebase and can be re-activated. See DISABLED_FEATURES.md in the repository for instructions.

# Project Lead
Zina Gonzales (Dr. G)
Social Worker

# User Impact
Dr. Gonzales relies on the central spreadsheet as a live data source for student schedules, contact information, entry/withdrawal records, and attendance/enrollment counts. If the automation stops running, the NAHS Transition Notes and NAMS Transition Notes databases will contain stale data and downstream campus projects will be affected. This in turn would mean that she would need to run these reports manually, daily, and update the spreadsheets by hand. This automated script saves her hours each day.

# Type
Google Apps Script — standalone script bound to a Google Spreadsheet. Trigger-based automation with a manual menu fallback.

# Primary Data Source
Cognos (NISD reporting system) — delivers five scheduled Excel reports daily via email between 3:00–3:05 AM to a Gmail account. Reports are automatically labeled and routed by Gmail filter rules.

# Script Link
https://script.google.com/u/0/home/projects/19In6MicCN5lA5-veL-67AugHtZ24VX3kK3I7O36cUub5E5-uUoE8m97Z/edit

Main spreadsheet ID: stored as Script Property `SPREADSHEET_MAIN` in the GAS project settings.

# Technical Stack
- Google Apps Script (V8 runtime)
- Gmail API (label-based email retrieval)
- Google Drive API v3 (Excel-to-Sheets conversion)
- Google Sheets API (data read/write)
- clasp (local development and deployment)
- Source code repository: GitHub → DataLake

# Trigger Logic
Five time-based triggers, one per weekday (Monday–Friday), each calling `updateSheetsFromEmail()` at 5:00 AM CT. Triggers must run under an account with Editor access (Dr. G) to the GAS project and all target spreadsheets. To view or recreate triggers: GAS editor → left sidebar → clock icon (Triggers).

# Recovery Steps
1. **Sheet not updating** — Check GAS editor → Executions panel for the 5:00 AM run. If it failed, check the error message. Common causes: Gmail label missing, Cognos email not delivered, OAuth authorization expired.
2. **OAuth expired** — Open GAS editor, run `updateSheetsFromEmail()` manually, accept the OAuth consent screen. Triggers will resume on the next scheduled run.
3. **Trigger missing** — Recreate it: GAS editor → Triggers → + Add Trigger → function: `updateSheetsFromEmail`, time-driven, week timer, select the missing weekday, 5:00–6:00 AM.
4. **Cognos report not arriving** — Log in to Cognos and verify the subscription is active and delivering to the correct Gmail label. If the subscription is tied to a departed employee's account, it must be recreated under the new owner's account.
5. **Run system tests** — From the GAS editor, run `runSystemTests()` to get a full health check of all configurations and connectivity.

# Gmail Labels

The following Gmail labels must exist in the Gmail account that receives Cognos reports. Each label is monitored by one email processing configuration.

| Label Path | Target Sheet |
|---|---|
| `Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Project Schedules` | Schedules |
| `Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Project Contact Information` | ContactInfo |
| `Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Entry_Withdrawal` | Entry_Withdrawal2 |
| `Campuses/NAHS/Transition Information Workflow Project/Alt_HS_Attendance_Enrollment_Count` | Alt_HS_Attendance_Enrollment_Count |
| `Campuses/NAHS/Transition Information Workflow Project/Alt_MS_Attendance_Enrollment_Count` | Alt_MS_Attendance_Enrollment_Count |

Gmail automatically routes incoming Cognos report emails to these labels using filter rules. If a label is missing or renamed, the corresponding sheet will stop updating.

# Consulting Contact

Alvaro Gomez  
[alvaro.gomez2011@gmail.com](mailto:alvaro.gomez2011@gmail.com)  
210-363-1577
