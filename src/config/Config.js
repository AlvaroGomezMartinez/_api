/**
 * Central configuration file for the NISD API project.
 * Contains all constants, spreadsheet IDs, and configuration objects.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 * @contact alvaro.gomez@nisd.net
 */

/**
 * Main configuration object containing all project settings
 */
const CONFIG = {
  /**
   * Spreadsheet IDs for various data sources and targets
   */
  SPREADSHEETS: {
    MAIN: "1uCQ_Z4QLbHq89tutZ4Wen0TREwS8qEx2j7MmzUgXOaY",
    NAHS_CRITERIA: "1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA",
    NAMS_CRITERIA: "1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak",
    NAHS_TRANSITION_NOTES: "14-nvlNOLWebnJJOQNZPnglWx0OuE5U-_xEbXGodND6E",
  },

  /**
   * Email configuration for automated data processing
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
      rangeToClear: "A2:J", // @todo Update to use new column organization from the report. Go to the email and check the new column orders.
    },
    {
      label:
        "Campuses/NAHS/Transition Information Workflow Project/Transition Informatin Workflow Entry_Withdrawal",
      sheetName: "Entry_Withdrawal2",
      rangeToClear: "A2:O",
    },
  ],

  /**
   * Manual data push configuration
   */
  PUSH_DATA_CONFIGS: {
    sourceSheets: {
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
      name: "NAHS Criteria Sheet",
      url: "https://docs.google.com/spreadsheets/d/1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA/edit?gid=644557240#gid=644557240",
    },
    {
      name: "NAMS 2025-26 Criteria Sheet",
      url: "https://docs.google.com/spreadsheets/d/1q61g_br0jmqtAvyQhNYto1jezfzjttmsKAAG-pznXak/edit?gid=1453553637#gid=1453553637",
    },
    {
      name: "NAHS 24-25 Student Transition Notes",
      url: "https://docs.google.com/spreadsheets/d/14-nvlNOLWebnJJOQNZPnglWx0OuE5U-_xEbXGodND6E/edit?gid=1422083122#gid=1422083122",
    },
  ],
};

/**
 * MIME type constants
 */
const MIME_TYPES = {
  EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  GOOGLE_SHEETS: MimeType.GOOGLE_SHEETS
};

/**
 * Common range patterns
 */
const RANGES = {
  SCHEDULES_CLEAR: "A2:O", // Range refers to the Schedules sheet in the _DataLake spreadsheet
  CONTACT_INFO_CLEAR: "A2:N", // Range refers to the ContactInfo sheet in the _DataLake spreadsheet
  ENTRY_WITHDRAWAL_CLEAR: "A2:O", // Range refers to the Entry_Withdrawal2 sheet in the _DataLake spreadsheet
  ALT_HS_ATTENDANCE: "A2:H", // Range refers to the Alt_HS_Attendance_Enrollment_Count sheet in the NAHS Criteria spreadsheet
  ENTRY_WITHDRAWAL_MANUAL: "A2:I", // Range refers to the Entry_Withdrawal sheet in the NAHS Criteria spreadsheet
  ALLERGIES: "A2:E" // Range refers to the Allergies sheet in the NAMS 2025-26 Criteria spreadsheet
};

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG"
};
