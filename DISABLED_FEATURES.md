# Disabled Features Documentation

## Overview
The following features were temporarily disabled on **2025-08-12** per user request. They remain available in the codebase (commented out) and can be easily re-activated if needed later in the year.

**UPDATE (2025-08-12)**: Alt_MS_Attendance_Enrollment_Count has been re-enabled and is now active.

## Currently Active Features

### Alt_MS_Attendance_Enrollment_Count (Re-enabled 2025-08-12)
- **Email Processing**: Automated updates from Cognos reports
- **Data Push**: Manual push to NAMS Criteria Sheet
- **Data Range**: A2:H
- **Purpose**: Middle school attendance data

## Currently Disabled Features

### 1. Allergies Data Push
- **Source**: `Allergies` sheet in main spreadsheet
- **Target**: NAMS Criteria Sheet (`Allergies` sheet)
- **Data Range**: A2:E
- **Purpose**: Manually maintained allergy information

### 2. Entry_Withdrawal Data Push  
- **Source**: `Entry_Withdrawal` sheet in main spreadsheet
- **Target**: NAHS Criteria Sheet (`Entry_Withdrawal` sheet)
- **Data Range**: A2:I
- **Purpose**: Manually maintained entry/withdrawal data

### 3. Alt_HS_Attendance_Enrollment_Count Data Push
- **Source**: `Alt_HS_Attendance_Enrollment_Count` sheet in main spreadsheet
- **Target**: NAHS Criteria Sheet (`Alt_HS_Attendance_Enrollment_Count` sheet)
- **Data Range**: A2:H
- **Purpose**: Manually maintained high school attendance data

## How to Re-enable Features

### Step 1: Update Configuration Files

**In `src/config/Config.js`:**

1. **For Email Processing** (uncomment in `EMAIL_CONFIGS` array):
```javascript
{
  label: "Campuses/NAHS/Transition Information Workflow Project/Alt_HS_Attendance_Enrollment_Count",
  sheetName: "Alt_HS_Attendance_Enrollment_Count",
  rangeToClear: "A2:H",
},
```

2. **For Data Push** (uncomment in `PUSH_DATA_CONFIGS.sourceSheets`):
```javascript
Alt_HS_Attendance_Enrollment_Count: {
  range: "A2:H",
  targets: [
    {
      spreadsheetId: "1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA",
      sheetName: "Alt_HS_Attendance_Enrollment_Count",
    },
  ],
},
Entry_Withdrawal: {
  range: "A2:I",
  targets: [
    {
      spreadsheetId: "1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA",
      sheetName: "Entry_Withdrawal",
    },
  ],
},
Allergies: {
  range: "A2:E",
  targets: [
    {
      spreadsheetId: "1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak",
      sheetName: "Allergies",
    },
  ],
},
```

### Step 2: Update Documentation

**In `README.md`:**
- Move features from "Temporarily Disabled" back to "Currently Active" section
- Update the feature descriptions as needed

**In `Code.js`:**
- Update the overview section to reflect active manual data sources
- Remove "(Currently Disabled)" notation

**In `Menu.js`:**
- Update the JSDoc examples to show the active feature mappings

### Step 3: Test Re-enabled Features

1. Run system tests: `runSystemTests()`
2. Check push data status: `getPushDataStatus()`
3. Test individual features:
   - For data push: Use the "🚩 Push Data" menu
   - For email processing: Monitor automated runs or test with `processSpecificLabel()`

### Step 4: Verify Target Spreadsheets

Ensure the target spreadsheets are still accessible:
- **NAHS Criteria Sheet**: `1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA`
- **NAMS Criteria Sheet**: `1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak`

## Implementation Notes

- All configurations remain intact in the codebase, just commented out
- No data or functionality has been permanently removed
- The system will gracefully handle the absence of these configurations
- Re-enabling should be straightforward and require minimal testing

## Contact

For questions about re-enabling these features:
- **Author**: Alvaro Gomez, Academic Technology Coach  
- **Email**: alvaro.gomez@nisd.net
