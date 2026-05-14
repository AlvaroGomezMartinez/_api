/**
 * @file Code.js
 * @module MainEntryPoints
 * @description Main entry points for automated data processing, spreadsheet management, and system operations.
 *
 * @typedef {Object} ProcessingResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} sheetName - Name of the processed sheet
 * @property {number} dataCount - Number of rows processed
 * @property {string} [error] - Error message if operation failed
 *
 * @typedef {Object} StatusInfo
 * @property {string} label - Gmail label or config name
 * @property {boolean} processed - Whether processing was successful
 * @property {string} [message] - Additional status message
 *
 * @author Alvaro Gomez
 * @version 2.1.0
 * @since 2025-08-04
 */

/**
 * @overview DataLake Project
 *
 * Supports a Google Spreadsheet that acts as a data API. Multiple sheets feed
 * data to downstream projects. Automated email processing pulls Excel attachments
 * from scheduled Cognos report emails and updates the corresponding sheets daily.
 *
 * ## Automated Sheets
 * - Schedules
 * - ContactInfo
 * - Entry_Withdrawal2
 * - Alt_HS_Attendance_Enrollment_Count
 * - Alt_MS_Attendance_Enrollment_Count
 *
 * ## Disabled (available for re-activation in Config.js)
 * - Entry_Withdrawal (manual push)
 * - Allergies (manual push)
 *
 * ## Automation Schedule
 * Five time-based triggers run every weekday at 5:00 AM (one per weekday).
 * Reports are emailed by the source system daily between 3:00–3:05 AM.
 *
 * @author Alvaro Gomez
 */

/**
 * Main function for automated email processing (called by triggers).
 * Processes all configured email labels, extracts data from Excel attachments, and updates corresponding spreadsheet sheets.
 * Designed to be called by time-based triggers for automated daily updates.
 *
 * @function
 * @returns {ProcessingResult[]} Processing results for each email configuration
 * @throws {Error} If email processing fails critically
 * @example
 * var results = updateSheetsFromEmail();
 * console.log('Processed ' + results.length + ' configurations');
 */


function updateSheetsFromEmail() {
  return withOperationLogging(
    function updateSheetsFromEmailBusinessLogic() {
      var results = EmailProcessor_processAllConfigs();
      var successful = results.filter(function(r) { return r.success; }).length;
      var failed = results.length - successful;
      if (failed === 0) {
        Logger.log("All sheets updated successfully!");
      } else {
        Logger.log('Completed with ' + successful + ' successful and ' + failed + ' failed updates');
      }
      return results;
    },
    'updateSheetsFromEmail',
    { triggerType: 'scheduled', configCount: CONFIG.EMAIL_CONFIGS.length }
  )();
}


/**
 * Processes emails for a specific Gmail label (for testing/debugging).
 * @function
 * @param {string} labelName - The Gmail label to process.
 * @returns {ProcessingResult} Processing result for the label.
 */
function processSpecificLabel(labelName) {
  try {
    return EmailProcessor_processSpecificLabel(labelName);
  } catch (error) {
    var errorMessage = ErrorHandler_handle(error, 'processSpecificLabel');
    throw error;
  }
}

/**
 * Gets the status of all email processing configurations.
 * @function
 * @returns {StatusInfo|Object} Status information for all configurations.
 */
function getEmailProcessingStatus() {
  try {
    return EmailProcessor_getProcessingStatus();
  } catch (error) {
    var errorMessage = ErrorHandler_handle(error, 'getEmailProcessingStatus');
    throw error;
  }
}

/**
 * Runs a dry run of email processing to validate configurations.
 * @function
 * @returns {Object} Validation results.
 */
function runEmailProcessingDryRun() {
  try {
    return EmailProcessor_dryRun();
  } catch (error) {
    var errorMessage = ErrorHandler_handle(error, 'runEmailProcessingDryRun');
    throw error;
  }
}

/**
 * Pushes data manually from source sheets to target spreadsheets.
 * @function
 * @returns {ProcessingResult[]} Push results for each data configuration.
 */


function pushDataToSheets() {
  return withOperationLogging(
    function pushDataToSheetsBusinessLogic() {
      return DataPusher_pushAllData();
    },
    'pushDataToSheets'
  )();
}

/**
 * Gets the status of all push data configurations.
 * @function
 * @returns {StatusInfo|Object} Status information for all push data configurations.
 */


function getPushDataStatus() {
  return withOperationLogging(
    function getPushDataStatusBusinessLogic() {
      return DataPusher_getPushDataStatus();
    },
    'getPushDataStatus'
  )();
}

/**
 * Runs comprehensive system tests.
 * @function
 * @returns {Object} Test results.
 */
function runSystemTests() {
  try {
    return Utils_runSystemTests();
  } catch (error) {
    var errorMessage = ErrorHandler_handle(error, 'runSystemTests');
    throw error;
  }
}

/**
 * Gets a summary of the current configuration.
 * @function
 * @returns {Object} Configuration summary.
 */
function getConfigurationSummary() {
  try {
    return Utils_getConfigurationSummary();
  } catch (error) {
    var errorMessage = ErrorHandler_handle(error, 'getConfigurationSummary');
    throw error;
  }
}
