/**
 * NISD API Project - Refactored Main Entry Points
 * 
 * This project supports a Google spreadsheet that simulates an API. The spreadsheet contains
 * multiple sheets that feed information to separate projects. The spreadsheet is meant
 * to make data gathering more time efficient. Three of the sheets have to be manually
 * updated (Alt_HS_Attendance_Enrollment_Count, Entry_Withdrawal, and Allergies) on this
 * project's spreadsheet because they do not have report subscription options in Cognos, but 
 * another three (Schedules, ContactInfo, and Entry_Withdrawal2)
 * are automatically updated using report subscriptions from Cognos and triggers that call
 * updateSheetsFromEmail(). The three subscribed Cognos reports are sent to Alvaro Gomez's gmail
 * from Cognos programatically and are automatically labeled using Gmail's labeling rules
 * service.
 * 
 * This script has been refactored to use a modular architecture with proper error handling,
 * logging, and configuration management.
 * 
 * Five (one for each day of the week) time-based triggers are configured to run this function
 * every weekday at 5:00 AM after the emails have been received from Cognos which are scheduled
 * between 4:00 - 4:03 AM each weekday.
 * 
 * Author: Alvaro Gomez, Academic Technology Coach
 * Office Phone: 1-210-397-9408
 * Cell Phone: 1-210-363-1577
 */

/**
 * Main function for automated email processing (called by triggers)
 * Updates sheets using data from emails' attached Excel files
 * @returns {Array<Object>} Processing results for each configuration
 */
function updateSheetsFromEmail() {
  const timer = AppLogger.startTimer('updateSheetsFromEmail');
  
  try {
    AppLogger.operationStart('updateSheetsFromEmail', {
      triggerType: 'scheduled',
      configCount: CONFIG.EMAIL_CONFIGS.length
    });
    
    // Use the refactored EmailProcessor
    const results = EmailProcessor.processAllConfigs();
    
    // Log summary for compatibility with existing monitoring
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    if (failed === 0) {
      Logger.log("All sheets updated successfully!");
      AppLogger.operationSuccess('updateSheetsFromEmail', {
        total: results.length,
        successful,
        failed
      }, timer.stop());
    } else {
      Logger.log(`Completed with ${successful} successful and ${failed} failed updates`);
      AppLogger.warn('updateSheetsFromEmail completed with some failures', {
        total: results.length,
        successful,
        failed,
        failures: results.filter(r => !r.success)
      });
    }
    
    return results;
    
  } catch (error) {
    timer.stop();
    const errorMessage = ErrorHandler.handle(error, 'updateSheetsFromEmail');
    Logger.log(`Error: ${errorMessage}`);
    AppLogger.operationFailure('updateSheetsFromEmail', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * Processes a single email configuration (now delegates to EmailProcessor)
 * 
 * @deprecated Use EmailProcessor.processSingleConfig() instead
 * @param {string} labelName - The Gmail label to search for
 * @param {string} spreadsheetId - The ID of the target Google Spreadsheet
 * @param {string} sheetName - The name of the sheet to update within the spreadsheet
 * @param {string} rangeToClear - The range to clear before inserting new data
 */
function processEmailToSheet(labelName, spreadsheetId, sheetName, rangeToClear) {
  try {
    AppLogger.warn('Using deprecated processEmailToSheet function', {
      labelName,
      spreadsheetId,
      sheetName,
      rangeToClear
    });
    
    // Create a temporary config object
    const config = {
      label: labelName,
      sheetName: sheetName,
      rangeToClear: rangeToClear
    };
    
    // Use the new EmailProcessor
    const result = EmailProcessor.processSingleConfig(config, 'processEmailToSheet_legacy');
    
    Logger.log(`Data inserted into sheet "${sheetName}" successfully!`);
    return result;
    
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'processEmailToSheet (legacy)');
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * Processes Excel data from a file blob (now delegates to DriveService)
 * 
 * @deprecated Use DriveService.processExcelData() instead
 * @param {Blob} fileBlob - The Excel file attachment as a Blob object
 * @returns {Array<Array<string>>} The extracted data from the Excel file, excluding the header row
 */
function processExcelData(fileBlob) {
  try {
    AppLogger.warn('Using deprecated processExcelData function');
    
    // Use the new DriveService
    return DriveService.processExcelData(fileBlob, 'processExcelData_legacy');
    
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'processExcelData (legacy)');
    throw error;
  }
}

// ================================
// NEW REFACTORED ENTRY POINTS
// ================================

/**
 * Processes emails for a specific Gmail label (for testing/debugging)
 * @param {string} labelName - The Gmail label to process
 * @returns {Object} Processing result
 */
function processSpecificLabel(labelName) {
  try {
    return EmailProcessor.processSpecificLabel(labelName);
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'processSpecificLabel');
    throw error;
  }
}

/**
 * Gets the status of all email processing configurations
 * @returns {Object} Status information
 */
function getEmailProcessingStatus() {
  try {
    return EmailProcessor.getProcessingStatus();
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'getEmailProcessingStatus');
    throw error;
  }
}

/**
 * Runs a dry run of email processing to validate configurations
 * @returns {Object} Validation results
 */
function runEmailProcessingDryRun() {
  try {
    return EmailProcessor.dryRun();
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'runEmailProcessingDryRun');
    throw error;
  }
}

/**
 * Pushes data manually from source sheets to target spreadsheets
 * @returns {Array<Object>} Push results
 */
function pushDataToSheets() {
  try {
    return DataPusher.pushAllData();
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'pushDataToSheets');
    throw error;
  }
}

/**
 * Gets the status of all push data configurations
 * @returns {Object} Status information
 */
function getPushDataStatus() {
  try {
    return DataPusher.getPushDataStatus();
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'getPushDataStatus');
    throw error;
  }
}

/**
 * Runs comprehensive system tests
 * @returns {Object} Test results
 */
function runSystemTests() {
  try {
    return Utils.runSystemTests();
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'runSystemTests');
    throw error;
  }
}

/**
 * Gets a summary of the current configuration
 * @returns {Object} Configuration summary
 */
function getConfigurationSummary() {
  try {
    return Utils.getConfigurationSummary();
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'getConfigurationSummary');
    throw error;
  }
}
