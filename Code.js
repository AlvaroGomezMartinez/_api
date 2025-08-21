/**
 * @file Code.js
 * @module MainEntryPoints
 * @description Main entry points for automated data processing, spreadsheet management, and system operations in the NISD API Project.
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
 * @author Alvaro Gomez, Academic Technology Coach
 * @contact alvaro.gomez@nisd.net
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * @overview NISD API Project
 * 
 * This project supports a Google spreadsheet that simulates an API. The spreadsheet contains
 * multiple sheets that feed information to separate projects. The spreadsheet is designed
 * to make data gathering more time efficient.
 * 
 * ## Data Sources
 * **Manual Updates Required (Partially Active):**
 * - Entry_Withdrawal (Disabled)
 * - Allergies (Disabled)
 * (Manual features were disabled on 2025-08-12 because the campus wasn't using those reports this year)
 * 
 * **Automated Updates:**
 * - Schedules
 * - ContactInfo
 * - Entry_Withdrawal2
 * - Alt_HS_Attendance_Enrollment_Count
 * - Alt_MS_Attendance_Enrollment_Count
 * (Updated via Cognos report subscriptions and email triggers)
 * 
 * ## Architecture
 * This script uses a modular architecture with:
 * - Proper error handling and logging
 * - Configuration management
 * - Service layer abstractions
 * - Comprehensive validation
 * 
 * ## Automation Schedule
 * Five time-based triggers run every weekday at 5:00 AM (one for each day of the week)
 * Cognos emails the reports daily (scheduled between 3:00 - 3:05 AM).
 * Emails are automatically labeled and filtered using Gmail's labeling rules service.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 * @contact Office: 1-210-397-9408 | Cell: 1-210-363-1577
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

// ...existing code for deprecated/legacy functions...
// function processEmailToSheet(labelName, spreadsheetId, sheetName, rangeToClear) {
//   try {
//     AppLogger_warn('Using deprecated processEmailToSheet function', {
//       labelName: labelName,
//       spreadsheetId: spreadsheetId,
//       sheetName: sheetName,
//       rangeToClear: rangeToClear
//     });
    
//     // Create a temporary config object
//     var config = {
//       label: labelName,
//       sheetName: sheetName,
//       rangeToClear: rangeToClear
//     };
    
//     // Use the new EmailProcessor
//     var result = EmailProcessor_processSingleConfig(config, 'processEmailToSheet_legacy');
    
//     Logger.log('Data inserted into sheet "' + sheetName + '" successfully!');
//     return result;
    
//   } catch (error) {
//     var errorMessage = ErrorHandler_handle(error, 'processEmailToSheet (legacy)');
//     throw error;
//   }
// }

/**
 * Legacy function for backward compatibility
 * Processes Excel data from a file blob (now delegates to DriveService)
 * 
 * @deprecated Use DriveService.processExcelData() instead
 * @param {Blob} fileBlob - The Excel file attachment as a Blob object
 * @returns {Array<Array<string>>} The extracted data from the Excel file, excluding the header row
 */
// function processExcelData(fileBlob) {
//   try {
//     AppLogger_warn('Using deprecated processExcelData function');
    
//     // Use the new DriveService
//     return DriveService_processExcelData(fileBlob, 'processExcelData_legacy');
    
//   } catch (error) {
//     var errorMessage = ErrorHandler_handle(error, 'processExcelData (legacy)');
//     throw error;
//   }
// }

// ================================
// NEW REFACTORED ENTRY POINTS
// ================================

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
