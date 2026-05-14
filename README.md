# DataLake — Google Apps Script Data Automation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Originally created for Northside Independent School District (NISD). Generalized and released for public use upon retirement.

A Google Apps Script project that automates daily data gathering by processing scheduled report emails, extracting Excel attachments, and pushing data into a central Google Spreadsheet that acts as a data API for downstream projects.

---

## What It Does

- **Automated email processing**: Monitors Gmail labels for incoming report emails, extracts Excel attachments, and updates corresponding sheets in a central spreadsheet — daily, on a schedule.
- **Manual data push**: Copies data from source sheets in the central spreadsheet to one or more target spreadsheets via a spreadsheet menu.
- **Status and testing**: Built-in menu items and functions to check system health, run dry runs, and verify configurations without making data changes.

> **📋 Note**: Some push data features are temporarily disabled. See [`DISABLED_FEATURES.md`](./DISABLED_FEATURES.md) for re-activation instructions.

---

## Setup

### Prerequisites

- A Google account with access to Gmail, Google Drive, and Google Sheets
- [Node.js](https://nodejs.org/) (LTS) and npm
- [clasp](https://github.com/google/clasp) — Google's CLI for Apps Script

```bash
npm install -g @google/clasp
```

### Deploy

```bash
clasp login          # Authenticate with your Google account
clasp pull           # Pull the current project from Apps Script
# make any edits
clasp push           # Push changes back to Apps Script
```

### Required Script Properties

After deploying, run `setupScriptProperties()` once from the Apps Script editor — or set the following properties manually via **Project Settings → Script Properties**:

| Property | Description |
|---|---|
| `SPREADSHEET_MAIN` | ID of the main/central spreadsheet |
| `SPREADSHEET_TARGET_1` | ID of the first target spreadsheet |
| `SPREADSHEET_TARGET_2` | ID of the second target spreadsheet |
| `SPREADSHEET_NOTES` | ID of the notes/handoff spreadsheet (optional) |

To find a spreadsheet ID, open the spreadsheet in your browser — it's the long string in the URL between `/d/` and `/edit`.

### Triggers

The main automation runs via time-based triggers. Set up five triggers manually in the Apps Script editor (one per weekday):

- **Function**: `updateSheetsFromEmail`
- **Event source**: Time-driven → Week timer
- **Day**: Monday / Tuesday / Wednesday / Thursday / Friday
- **Time**: 5:00 AM – 6:00 AM (adjust to your timezone)

---

## Configuration

All settings live in `src/config/Config.js`. The three sections you'll edit:

**`SPREADSHEETS`** — loaded from Script Properties at runtime (set via `setupScriptProperties()`).

**`EMAIL_CONFIGS`** — one entry per Gmail label to monitor:
```javascript
{
  label: "Your/Gmail/Label/Path",
  sheetName: "TargetSheetName",
  rangeToClear: "A2:O"
}
```

**`PUSH_DATA_CONFIGS.sourceSheets`** — one entry per sheet to push to a target spreadsheet:
```javascript
SheetName: {
  range: "A2:H",
  targets: [{
    spreadsheetId: _IDS.TARGET_1,
    sheetName: "TargetSheetName"
  }]
}
```

---

## Architecture

```
src/
├── config/
│   └── Config.js          # ⭐ All settings — edit here first
├── main/
│   ├── EmailProcessor.js  # Orchestrates email → sheet pipeline
│   └── DataPusher.js      # Orchestrates sheet → target push
├── services/
│   ├── EmailService.js    # Gmail label and attachment operations
│   ├── DriveService.js    # Drive file creation and Excel conversion
│   └── SheetService.js    # Sheet read, clear, and write operations
└── utils/
    ├── Logger.js          # Structured logging (ERROR/WARN/INFO/DEBUG)
    ├── ErrorHandler.js    # Retry logic and error handling
    ├── DateUtils.js       # Date formatting helpers
    ├── Validators.js      # Input validation
    ├── Utils.js           # General utilities and system tests
    └── Tests.js           # Test suite
Code.js                    # Public entry point functions
Menu.js                    # Spreadsheet UI menu
appsscript.json            # GAS manifest
```

---

## Usage

### Automated (via triggers)

Triggers call `updateSheetsFromEmail()` on the configured schedule. No manual action needed once triggers are set up.

### Manual operations (from the spreadsheet menu)

Open the spreadsheet → **🚩 Push Data** menu:

| Menu item | What it does |
|---|---|
| Push Data to Sheets | Copies data from source sheets to all configured target spreadsheets |
| Check Push Status | Shows current row counts and target accessibility |
| Test Email Processing | Shows label status and latest email dates |
| Run System Tests | Runs full connectivity and configuration checks |

### Developer functions (from the Apps Script editor)

```javascript
// Process all configured Gmail labels
updateSheetsFromEmail()

// Process a single label
processSpecificLabel("Your/Gmail/Label/Path")

// Validate configs without making changes
runEmailProcessingDryRun()

// Check status
getEmailProcessingStatus()
getPushDataStatus()

// Run all system tests
runSystemTests()
```

---

## Error Handling

- **Retry logic**: Failed operations retry up to 5 times with a 1-second delay (configurable in `RETRY_CONFIG`).
- **Batch resilience**: A single sheet failure does not abort the full batch — partial results are returned.
- **Logging**: All operations log to Stackdriver (Google Cloud Logging) via `"exceptionLogging": "STACKDRIVER"` in `appsscript.json`. View logs at [console.cloud.google.com](https://console.cloud.google.com) → Logs Explorer.
- **Log levels**: ERROR, WARN, INFO, DEBUG (set `logLevel` in `CONFIG.SETTINGS`).

---

## Testing

```javascript
runSystemTests()    // Connectivity, config validation, dry run — all in one
runAllTests()       // Full unit + integration test suite
```

Tests cover configuration validation, Gmail and spreadsheet connectivity, utility functions, and a dry run of the email processing pipeline.

---

## Attribution

Originally built by [Alvaro Gomez](mailto:alvaro.gomez2011@gmail.com) for Northside Independent School District (NISD). Generalized for public use upon retirement.

---

## License

[MIT](LICENSE)
