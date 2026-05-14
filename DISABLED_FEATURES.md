# Disabled Features

Some data push features are currently commented out in `src/config/Config.js`. They are fully implemented and can be re-activated at any time.

## Currently Disabled

| Feature | Source Sheet | Target Sheet | Range |
|---|---|---|---|
| Entry_Withdrawal push | `Entry_Withdrawal` | Target spreadsheet 1 | A2:I |
| Allergies push | `Allergies` | Target spreadsheet 2 | A2:E |

## How to Re-enable

### Step 1 — Uncomment in `src/config/Config.js`

In `PUSH_DATA_CONFIGS.sourceSheets`, uncomment the relevant block(s):

```javascript
Entry_Withdrawal: {
  range: "A2:I",
  targets: [
    {
      spreadsheetId: _IDS.TARGET_1,
      sheetName: "Entry_Withdrawal",
    },
  ],
},
Allergies: {
  range: "A2:E",
  targets: [
    {
      spreadsheetId: _IDS.TARGET_2,
      sheetName: "Allergies",
    },
  ],
},
```

Also uncomment the corresponding entries in the `RANGES` constant at the bottom of the file:

```javascript
ENTRY_WITHDRAWAL_MANUAL: "A2:I",
ALLERGIES: "A2:E",
```

### Step 2 — Verify target spreadsheets are accessible

Confirm the Script Properties `SPREADSHEET_TARGET_1` and `SPREADSHEET_TARGET_2` point to spreadsheets that contain the target sheets (`Entry_Withdrawal` and `Allergies` respectively).

### Step 3 — Deploy and test

```bash
clasp push
```

Then from the GAS editor:

```javascript
runSystemTests()      // Verify overall health
getPushDataStatus()   // Confirm new sheets appear as configured
```

Use the **🚩 Push Data** menu in the spreadsheet to do a live test push.

## Notes

- No code was deleted — everything is commented out and ready to restore.
- The automated email processing pipeline is unaffected by these disabled features.
- If the target sheets don't exist in the target spreadsheets, create them before re-enabling.
