/**
 * DataLake Project Configuration
 * Central configuration file for the DataLake project.
 * Contains all constants, spreadsheet IDs, and configuration objects.
 * Compatible with Google Apps Script V8 runtime.
 *
 * Spreadsheet IDs are loaded from Script Properties at runtime.
 * Run setupScriptProperties() once after deployment to initialize them.
 *
 * Required Script Properties:
 *   SPREADSHEET_MAIN             - Main data lake spreadsheet ID
 *   SPREADSHEET_TARGET_1         - First target/criteria spreadsheet ID
 *   SPREADSHEET_TARGET_2         - Second target/criteria spreadsheet ID
 *   SPREADSHEET_NOTES            - Notes/handoff spreadsheet ID (optional)
 *
 * @file Project configuration for DataLake project.
 * @author Alvaro Gomez
 * @version 2.1.0
 * @since 2025-08-04
 */

/**
 * Loads all spreadsheet IDs from Script Properties.
 * Falls back to empty strings if a property is not set (will surface as a
 * clear error when the script tries to open the spreadsheet).
 * @returns {Object} Spreadsheet ID map.
 */
function Config_getSpreadsheetIds() {
  var props = PropertiesService.getScriptProperties();
  return {
    MAIN:                props.getProperty('SPREADSHEET_MAIN')        || '',
    TARGET_1:            props.getProperty('SPREADSHEET_TARGET_1')    || '',
    TARGET_2:            props.getProperty('SPREADSHEET_TARGET_2')    || '',
    NOTES:               props.getProperty('SPREADSHEET_NOTES')       || '',
  };
}

/**
 * One-time setup: stores spreadsheet IDs as Script Properties.
 * Run this function once from the GAS editor after cloning/deploying the project.
 * Edit the values below before running.
 * @function
 */
function setupScriptProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'SPREADSHEET_MAIN':     'YOUR_MAIN_SPREADSHEET_ID',
    'SPREADSHEET_TARGET_1': 'YOUR_TARGET_1_SPREADSHEET_ID',
    'SPREADSHEET_TARGET_2': 'YOUR_TARGET_2_SPREADSHEET_ID',
    'SPREADSHEET_NOTES':    'YOUR_NOTES_SPREADSHEET_ID',
  });
  Logger.log('Script Properties set. Verify with: PropertiesService.getScriptProperties().getProperties()');
}

/**
 * Main configuration object containing all project settings.
 * @namespace CONFIG
 * @example
 * // Access a spreadsheet ID
 * var mainSpreadsheetId = CONFIG.SPREADSHEETS.MAIN;
 * // Access email configurations
 * var emailConfigs = CONFIG.EMAIL_CONFIGS;
 * // Access push data configurations
 * var pushConfigs = CONFIG.PUSH_DATA_CONFIGS;
 */
var _IDS = Config_getSpreadsheetIds();

var CONFIG = {
  /**
   * @type {Object}
   * @description Spreadsheet IDs loaded from Script Properties at runtime.
   * Set these via setupScriptProperties() before first use.
   * @property {string} MAIN - Main data lake spreadsheet ID
   * @property {string} TARGET_1 - First target/criteria spreadsheet ID
   * @property {string} TARGET_2 - Second target/criteria spreadsheet ID
   * @property {string} NOTES - Notes/handoff spreadsheet ID
   */
  SPREADSHEETS: {
    MAIN:   _IDS.MAIN,
    TARGET_1: _IDS.TARGET_1,
    TARGET_2: _IDS.TARGET_2,
    NOTES:  _IDS.NOTES,
  },

  /**
   * @type {Array<Object>}
   * @description Email configuration for automated data processing
   * @property {string} label - Gmail label to monitor for incoming data
   * @property {string} sheetName - Target sheet name in the main spreadsheet
   * @property {string} rangeToClear - Range to clear before importing new data
   * @example
   * // Each configuration object:
   * {
   *   label: "Campuses/NAHS/Reports/Daily",
   *   sheetName: "DailyData",
   *   rangeToClear: "A2:Z"
   * }
   */
  EMAIL_CONFIGS: [
    {
      label:
        "Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Project Schedules",
      sheetName: "Schedules",
      rangeToClear: "A2:O",
    },
    {
      label:
        "Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Project Contact Information",
      sheetName: "ContactInfo",
      rangeToClear: "A2:O",
    },
    {
      label:
        "Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Entry_Withdrawal",
      sheetName: "Entry_Withdrawal2",
      rangeToClear: "A2:O",
    },
    {
      label:
        "Campuses/NAHS/Transition Information Workflow Project/Alt_HS_Attendance_Enrollment_Count",
      sheetName: "Alt_HS_Attendance_Enrollment_Count",
      rangeToClear: "A2:H",
    },
    {
      label:
        "Campuses/NAHS/Transition Information Workflow Project/Alt_MS_Attendance_Enrollment_Count",
      sheetName: "Alt_MS_Attendance_Enrollment_Count",
      rangeToClear: "A2:H",
    },
  ],

  /**
   * @type {Object}
   * @description Manual data push configuration for copying data between spreadsheets
   * @property {Object} [sheetName] - Configuration for each source sheet
   * @property {string} [sheetName].range - Source range to read data from
   * @property {Array<Object>} [sheetName].targets - Target spreadsheets to push data to
   * @example
   * // Configuration structure:
   * PUSH_DATA_CONFIGS: {
   *   "SourceSheet": {
   *     range: "A2:H",
   *     targets: [{
   *       spreadsheetId: "1ABC...XYZ",
   *       sheetName: "TargetSheet"
   *     }]
   *   }
   * }
   */
  PUSH_DATA_CONFIGS: {
    sourceSheets: {
      // DISABLED FEATURES - Commented out as per user request (2025-08-12)
      // These features have been temporarily disabled but can be re-enabled by uncommenting
      // and updating the documentation accordingly.
      //
      // Alt_HS_Attendance_Enrollment_Count: {
      //   range: "A2:H",
      //   targets: [
      //     {
      //       spreadsheetId: _IDS.TARGET_1,
      //       sheetName: "Alt_HS_Attendance_Enrollment_Count",
      //     },
      //   ],
      // },
      Alt_MS_Attendance_Enrollment_Count: {
        range: "A2:H",
        targets: [
          {
            spreadsheetId: _IDS.TARGET_2,
            sheetName: "Alt_MS_Attendance_Enrollment_Count",
          },
        ],
      },
      // Entry_Withdrawal: {
      //   range: "A2:I",
      //   targets: [
      //     {
      //       spreadsheetId: _IDS.TARGET_1,
      //       sheetName: "Entry_Withdrawal",
      //     },
      //   ],
      // },
      // Allergies: {
      //   range: "A2:E",
      //   targets: [
      //     {
      //       spreadsheetId: _IDS.TARGET_2,
      //       sheetName: "Allergies",
      //     },
      //   ],
      // },
    },
  },

  /**
   * Retry configuration for operations that may fail temporarily
   */
  RETRY_CONFIG: {
    maxRetries: 5,
    retryDelay: 1000, // milliseconds
    fileCleanupDelay: 2000, // milliseconds
  },

  /**
   * Application settings
   */
  SETTINGS: {
    timezone: "America/Chicago",
    dateFormat: "MM/dd/yyyy",
    logLevel: "INFO",
  },

  /**
   * Success dialog links for the manual push feature.
   * URLs are constructed from Script Properties at runtime.
   */
  SUCCESS_LINKS: [
    {
      name: "Target Spreadsheet 2",
      url: "https://docs.google.com/spreadsheets/d/" + _IDS.TARGET_2 + "/edit",
    },
    {
      name: "Notes Spreadsheet",
      url: "https://docs.google.com/spreadsheets/d/" + _IDS.NOTES + "/edit",
    },
  ],
};

/**
 * MIME type constants
 */
var MIME_TYPES = {
  EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  GOOGLE_SHEETS: MimeType.GOOGLE_SHEETS
};

/**
 * Common range patterns
 */
var RANGES = {
  SCHEDULES_CLEAR: "A2:O", // Range refers to the Schedules sheet in the _DataLake spreadsheet
  CONTACT_INFO_CLEAR: "A2:N", // Range refers to the ContactInfo sheet in the _DataLake spreadsheet
  ENTRY_WITHDRAWAL_CLEAR: "A2:O", // Range refers to the Entry_Withdrawal2 sheet in the _DataLake spreadsheet
  ALT_HS_ATTENDANCE: "A2:H", // Range refers to the Alt_HS_Attendance_Enrollment_Count sheet in the NAHS Criteria spreadsheet
  ALT_MS_ATTENDANCE: "A2:H", // Range refers to the Alt_MS_Attendance_Enrollment_Count sheet in the NAMS 2025-26 Criteria spreadsheet
  
  // DISABLED RANGES - Commented out as features are disabled (2025-08-12)
  // ENTRY_WITHDRAWAL_MANUAL: "A2:I", // Range refers to the Entry_Withdrawal sheet in the NAHS Criteria spreadsheet
  // ALLERGIES: "A2:E", // Range refers to the Allergies sheet in the NAMS 2025-26 Criteria spreadsheet
};

/**
 * Log levels
 */
var LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG"
};
