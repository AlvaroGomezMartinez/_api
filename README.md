# _DataLake Project

## Project Description
This project supports a Google spreadsheet that simulates an API. The spreadsheet contains five sheets that feed data to separate projects. The spreadsheet is meant to automate data gathering. Manual data push features have been temporarily disabled (2025-08-12) but can be re-activated as needed. Automated email processing features remain active.

> **📋 Important**: Some features have been temporarily disabled. See [`DISABLED_FEATURES.md`](./DISABLED_FEATURES.md) for details and re-activation instructions.

## Architecture Overview

The codebase follows a layered architecture pattern:

```
├── src/
│   ├── config/
│   │   └── Config.js          # Centralized configuration
│   ├── services/
│   │   ├── EmailService.js    # Gmail operations
│   │   ├── DriveService.js    # Google Drive operations
│   │   └── SheetService.js    # Spreadsheet operations
│   ├── utils/
│   │   ├── Logger.js          # Structured logging
│   │   ├── ErrorHandler.js    # Error handling utilities
│   │   ├── DateUtils.js       # Date formatting utilities
│   │   ├── Validators.js      # Input validation
│   │   ├── Utils.js           # General utilities
│   │   └── Tests.js           # Test functions
│   └── main/
│       ├── EmailProcessor.js  # Email processing logic
│       └── DataPusher.js      # Manual data push logic
├── Code.js                    # Main entry points
├── Menu.js                    # UI and menu functions
└── Get Labels.js              # Legacy utilities (deprecated)
```

### Key Features

#### 🔧 **Automated Email Processing**
- Processes emails from specific Gmail labels
- Extracts Excel attachments and converts them to data
- Updates target spreadsheet sheets automatically
- Runs on weekday triggers at 5:00 AM

#### 📊 **Manual Data Push**
- Pushes data from source sheets to multiple target spreadsheets
- Configurable source and target mappings
- Batch processing with individual error handling

#### 🛠️ **Enhanced Error Handling**
- Comprehensive error catching and logging
- Retry mechanisms for transient failures
- Structured error reporting with context

#### 📝 **Structured Logging**
- Multiple log levels (INFO, WARN, ERROR, DEBUG)
- Performance monitoring with timers
- Operation tracking and batch summaries

#### ✅ **Validation & Testing**
- Input validation for all operations
- System connectivity tests
- Dry run capabilities for safe testing

### Main Functions

#### Email Processing
```javascript
updateSheetsFromEmail()          // Main automated function (called by triggers)
processSpecificLabel(labelName) // Process a specific Gmail label
getEmailProcessingStatus()       // Get status of email configurations
runEmailProcessingDryRun()       // Validate configurations without changes
```

#### Data Push Operations
```javascript
pushDataToSheets()              // Manual data push (called from menu)
getPushDataStatus()             // Get status of push configurations
```

#### System Management
```javascript
runSystemTests()               // Comprehensive system tests
getConfigurationSummary()      // Get current configuration summary
```

### Configuration

All project settings are centralized in `src/config/Config.js`:

- **Spreadsheet IDs**: Main and target spreadsheet identifiers
- **Email Configurations**: Gmail labels and corresponding sheets
- **Push Data Configurations**: Source to target mappings
- **System Settings**: Timezone, retry policies, etc.

### Spreadsheet Integration

The project integrates with several Google Spreadsheets:

1. **Main Spreadsheet** (`1uCQ_Z4QLbHq89tutZ4Wen0TREwS8qEx2j7MmzUgXOaY`)
   - Central data repository
   - Contains both automated and manual sheets

2. **NAHS Criteria Sheet** (`1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA`)
   - Target for attendance and entry/withdrawal data

3. **NAMS Criteria Sheet** (`1O3DSgTbhphNVDXLmlGkEiyVejsL_l4fPsf2cJJpQpTo`)
   - Target for allergies data

### Automated Sheets (Email Processing)
- **Schedules**: Updated daily from the scheduled Cognos report called, "My My SCHD - CY Students List (2)"
- **ContactInfo**: Updated daily from the scheduled Cognos report called, "My Student CY List - Student Email/Contact Info - Next Year Option (3)"  
- **Entry_Withdrawal2**: Updated daily from the scheduled Cognos report called, "My Student CY List - Entry/Withdrawal in DateRange (2)"
- **Alt_HS_Attendance_Enrollment_Count**: Updated daily from the scheduled Cognos report called, "My Alt HS Attendance/Enrollment Count (3)"
- **Alt_MS_Attendance_Enrollment_Count**: Updated daily from the scheduled Cognos report called, "My Alt MS Attendance/Enrollment Count"

**Temporarily Disabled (Available for Re-activation):**
- **Entry_Withdrawal**: Manually maintained entry/withdrawal data
- **Allergies**: Manually maintained allergy information

> **Note**: Most manual features were disabled on 2025-08-12 per user request but remain available in the codebase (commented out) for potential re-activation later in the year.

### Usage

#### For End Users
1. **Automated Processing**: Runs automatically via GAS triggers
2. **Manual Data Push**: Use the "🚩 Push Data" menu in the spreadsheet
3. **Status Checking**: Use menu items to check system status

#### For Developers
```javascript
// Run comprehensive tests
runSystemTests()

// Check specific component status
getEmailProcessingStatus()
getPushDataStatus()

// Process specific operations
processSpecificLabel("specific/gmail/label")
```

### Error Handling & Monitoring

The refactored system provides comprehensive error handling:

- **Graceful Failures**: Individual operation failures don't stop batch processing
- **Detailed Logging**: All operations are logged with context and timing
- **Retry Logic**: Automatic retries for transient failures
- **Status Reporting**: Real-time status of all configurations

### Testing

The project includes a comprehensive test suite:

```javascript
runAllTests()        // Run all available tests
showTestResults()    // Display test results in UI
```

Tests cover:
- Configuration validation
- Service connectivity
- Utility function validation
- System integration tests

### Migration Notes

**Legacy functions are maintained for backward compatibility** but marked as deprecated:
- `processEmailToSheet()` → Use `EmailProcessor.processSingleConfig()`
- `processExcelData()` → Use `DriveService.processExcelData()`
- `updateTargetSheet()` → Use `SheetService.updateSheet()`

### Benefits of Refactoring

1. **Maintainability**: Modular structure makes updates easier
2. **Reliability**: Better error handling and retry mechanisms
3. **Debuggability**: Comprehensive logging and status reporting
4. **Scalability**: Easy to add new features and configurations
5. **Testability**: Built-in testing and validation capabilities

### Author
[Alvaro Gomez](mailto:alvaro.gomez@nisd.net), Academic Technology Coach<br>
Office: 1-210-397-9408<br>
Mobile: 1-210-363-1577
