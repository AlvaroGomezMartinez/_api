/**
 * @fileoverview NISD API Project Configuration
 * @description Central configuration file for the NIS      // DISABLED FEATURES - Commented out as features are disabled (2025-08-12)
      // These features have been temporarily disabled but can be re-enabled by uncommenting
      // and updating the documentation accordingly.
      //
      Alt_HS_Attendance_Enrollment_Count: {
        range: "A2:H",
        targets: [
          {
            spreadsheetId: "1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA",
            sheetName: "Alt_HS_Attendance_Enrollment_Count",
          },
        ],
      },
      Alt_MS_Attendance_Enrollment_Count: {
 * Contains all constants, spreadsheet IDs, and configuration objects.
 * @author Alvaro Gomez, Academic Technology Coach
 * @contact alvaro.gomez@nisd.net
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * @namespace CONFIG
 * @description Main configuration object containing all project settings
 * @example
 * // Access a spreadsheet ID
 * var mainSpreadsheetId = CONFIG.SPREADSHEETS.MAIN;
 * 
 * // Access email configurations
 * var emailConfigs = CONFIG.EMAIL_CONFIGS;
 * 
 * // Access push data configurations
 * var pushConfigs = CONFIG.PUSH_DATA_CONFIGS;
 */
var CONFIG = {
  /**
   * @type {Object}
   * @description Spreadsheet IDs for various data sources and targets
   * @property {string} MAIN - Main project spreadsheet ID
   * @property {string} NAHS_CRITERIA - NAHS criteria spreadsheet ID
   * @property {string} NAMS_CRITERIA - NAMS criteria spreadsheet ID
   * @property {string} NAHS_TRANSITION_NOTES - NAHS transition notes spreadsheet ID
   */
  SPREADSHEETS: {
    MAIN: "1uCQ_Z4QLbHq89tutZ4Wen0TREwS8qEx2j7MmzUgXOaY",
    NAHS_CRITERIA: "1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA",
    NAMS_CRITERIA: "1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak",
    NAHS_TRANSITION_NOTES: "14-nvlNOLWebnJJOQNZPnglWx0OuE5U-_xEbXGodND6E",
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
      //       spreadsheetId: "1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA",
      //       sheetName: "Alt_HS_Attendance_Enrollment_Count",
      //     },
      //   ],
      // },
      Alt_MS_Attendance_Enrollment_Count: {
        range: "A2:H",
        targets: [
          {
            spreadsheetId: "1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak",
            sheetName: "Alt_MS_Attendance_Enrollment_Count",
          },
        ],
      },
      // Entry_Withdrawal: {
      //   range: "A2:I",
      //   targets: [
      //     {
      //       spreadsheetId: "1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA",
      //       sheetName: "Entry_Withdrawal",
      //     },
      //   ],
      // },
      // Allergies: {
      //   range: "A2:E",
      //   targets: [
      //     {
      //       spreadsheetId: "1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak",
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
   * Success dialog links for the manual push feature
   */
  SUCCESS_LINKS: [
    {
      name: "NAMS 2025-26 Criteria Sheet",
      url: "https://docs.google.com/spreadsheets/d/1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak/edit?gid=1453553637#gid=1453553637",
    },
    {
      name: "NAHS 2025-26 Student Transition Notes",
      url: "https://docs.google.com/spreadsheets/d/14-nvlNOLWebnJJOQNZPnglWx0OuE5U-_xEbXGodND6E/edit?gid=1422083122#gid=1422083122",
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
