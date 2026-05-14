/**
 * @file Menu.js
 * @module Menu
 * @description Provides Google Sheets menu integration and user interface functions for the DataLake project.
 *
 * @typedef {Object} OperationResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [sourceSheet] - Name of the source sheet
 * @property {string} [error] - Error message if operation failed
 *
 * @author Alvaro Gomez
 * @version 2.1.0
 * @since 2025-08-04
 */

/**
 * Creates the custom menu when the spreadsheet is opened.
 * This function is automatically called by Google Sheets when the spreadsheet is opened.
 * It creates a custom menu with data processing and testing options.
 *
 * @function
 * @memberof Google.Apps.Script.Events
 * @example
 * // Automatically called by Google Sheets, no manual invocation needed
 * @since 1.0.0
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚩 Push Data')
    .addItem('Push Data to Sheets', 'pushDataToSheets')
    .addSeparator()
    .addItem('Check Push Status', 'showPushDataStatus')
    .addItem('Test Email Processing', 'showEmailProcessingStatus')
    .addSeparator()
    .addItem('Run System Tests', 'showSystemTestResults')
    .addToUi();
}

/**
 * Pushes data from source sheets to target spreadsheets (menu action).
 * Reads data from configured source sheets and pushes them to target sheets in external spreadsheets.
 *
 * @function
 * @returns {void}
 * @since 1.0.0
 * @see {@link DataPusher_pushAllData} for the underlying implementation
 */
function pushDataToSheets() {
  var timer = AppLogger_startTimer('pushDataToSheets_menu');
  
  try {
    AppLogger_operationStart('pushDataToSheets (menu)', {
      trigger: 'user_menu'
    });

    // Use the refactored DataPusher
    var results = DataPusher_pushAllData();
    
    // Check if all operations were successful
    var successful = results.filter(function(r) { return r.success; }).length;
    var failed = results.length - successful;
    
    if (failed === 0) {
      // Show custom dialog box with success message and links
      showSuccessDialog();
      AppLogger_operationSuccess('pushDataToSheets (menu)', {
        total: results.length,
        successful: successful,
        failed: failed
      }, timer.stop());
    } else {
      // Show error dialog with details
      showErrorDialog(results);
      AppLogger_warn('pushDataToSheets (menu) completed with failures', {
        total: results.length,
        successful: successful,
        failed: failed
      });
    }

  } catch (error) {
    timer.stop();
    var errorMessage = ErrorHandler_handle(error, 'pushDataToSheets (menu)');
    AppLogger_operationFailure('pushDataToSheets (menu)', error);
    
    SpreadsheetApp.getUi().alert('An error occurred: ' + errorMessage);
  }
}

/**
 * Shows a custom success dialog with hyperlinks.
 * Now uses configuration-driven links.
 * @function
 * @returns {void}
 */
function showSuccessDialog() {
  try {
    var htmlContent = DataPusher_createSuccessDialogContent();
    
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(400)
      .setHeight(200);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Data Push Successful");
    
    AppLogger_info('Success dialog displayed');
    
  } catch (error) {
    AppLogger_error('Failed to show success dialog', error);
    SpreadsheetApp.getUi().alert('Data was pushed successfully to the reports.');
  }
}

/**
 * Shows an error dialog with details about failed operations.
 * @function
 * @param {OperationResult[]} results - Array of operation results.
 * @returns {void}
 */
function showErrorDialog(results) {
  try {
    var failed = results.filter(function(r) { return !r.success; });
    var successful = results.filter(function(r) { return r.success; });
    
    var message = 'Push completed with ' + successful.length + ' successful and ' + failed.length + ' failed operations.\n\n';
    
    if (failed.length > 0) {
      message += "Failed operations:\n";
      failed.forEach(function(result) {
        message += '• ' + result.sourceSheet + ': ' + result.error + '\n';
      });
    }
    
    if (successful.length > 0) {
      message += "\nSuccessful operations:\n";
      successful.forEach(function(result) {
        message += '• ' + result.sourceSheet + '\n';
      });
    }
    
    SpreadsheetApp.getUi().alert("Data Push Results", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger_info('Error dialog displayed', {
      successful: successful.length,
      failed: failed.length
    });
    
  } catch (error) {
    AppLogger_error('Failed to show error dialog', error);
    SpreadsheetApp.getUi().alert('Some operations failed. Check the logs for details.');
  }
}

/**
 * Shows the current push data status.
 * @function
 * @returns {void}
 */
function showPushDataStatus() {
  try {
    AppLogger_operationStart('showPushDataStatus');
    
    var status = DataPusher_getPushDataStatus();
    
    var message = 'Push Data Status (' + DateUtils_formatDate() + '):\n\n';
    
    status.sourceSheets.forEach(function(sheet) {
      if (sheet.error) {
        message += '❌ ' + sheet.sheetName + ': ERROR - ' + sheet.error + '\n';
      } else {
        message += '✅ ' + sheet.sheetName + ':\n';
        message += '   • Data: ' + sheet.currentRowCount + ' rows, ' + sheet.currentColumnCount + ' columns\n';
        message += '   • Range: ' + sheet.range + '\n';
        message += '   • Targets: ' + sheet.targetCount + ' configured\n';
        
        var accessibleTargets = sheet.targets.filter(function(t) { return t.accessible; }).length;
        if (accessibleTargets < sheet.targetCount) {
          message += '   ⚠️ Warning: ' + (sheet.targetCount - accessibleTargets) + ' targets not accessible\n';
        }
        message += '\n';
      }
    });
    
    SpreadsheetApp.getUi().alert("Push Data Status", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger_operationSuccess('showPushDataStatus');
    
  } catch (error) {
    AppLogger_operationFailure('showPushDataStatus', error);
    SpreadsheetApp.getUi().alert('Error getting push data status: ' + error.message);
  }
}

/**
 * Shows the current email processing status.
 * @function
 * @returns {void}
 */
function showEmailProcessingStatus() {
  try {
    AppLogger_operationStart('showEmailProcessingStatus');
    
    var status = EmailProcessor_getProcessingStatus();
    
    var message = 'Email Processing Status (' + DateUtils_formatDate() + '):\n\n';
    
    status.configurations.forEach(function(config) {
      if (config.error) {
        message += '❌ ' + config.sheetName + ': ERROR - ' + config.error + '\n';
      } else {
        message += (config.labelExists ? '✅' : '❌') + ' ' + config.sheetName + ':\n';
        message += '   • Label: ' + (config.labelExists ? 'Found' : 'Not Found') + '\n';
        message += '   • Emails: ' + config.emailCount + '\n';
        if (config.latestEmailDate) {
          message += '   • Latest: ' + DateUtils_formatDate(config.latestEmailDate) + '\n';
        }
        message += '   • Range: ' + config.rangeToClear + '\n\n';
      }
    });
    
    SpreadsheetApp.getUi().alert("Email Processing Status", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger_operationSuccess('showEmailProcessingStatus');
    
  } catch (error) {
    AppLogger_operationFailure('showEmailProcessingStatus', error);
    SpreadsheetApp.getUi().alert('Error getting email processing status: ' + error.message);
  }
}

/**
 * Shows system test results.
 * @function
 * @returns {void}
 */
function showSystemTestResults() {
  try {
    AppLogger_operationStart('showSystemTestResults');
    
    var results = Utils_runSystemTests();
    
    var message = 'System Test Results (' + DateUtils_formatDate() + '):\n\n';
    message += 'Overall Status: ' + results.overall + '\n\n';
    
    // Summary of test categories
    for (var testName in results.tests) {
      if (results.tests.hasOwnProperty(testName)) {
        var testResult = results.tests[testName];
        if (testResult.error) {
          message += '❌ ' + testName + ': ERROR\n';
        } else if (testName === 'emailProcessorDryRun') {
          message += (testResult.valid ? '✅' : '⚠️') + ' ' + testName + ': ' + (testResult.valid ? 'PASS' : 'ISSUES') + '\n';
        } else {
          message += '✅ ' + testName + ': PASS\n';
        }
      }
    }
    
    if (results.overall !== 'PASS') {
      message += '\nSee console logs for detailed error information.';
    }
    
    SpreadsheetApp.getUi().alert("System Test Results", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger_operationSuccess('showSystemTestResults', { overall: results.overall });
    
  } catch (error) {
    AppLogger_operationFailure('showSystemTestResults', error);
    SpreadsheetApp.getUi().alert('Error running system tests: ' + error.message);
  }
}


