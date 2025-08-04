/**
 * Menu and UI functions for the NISD API project.
 * Provides spreadsheet menu items and dialog functionality.
 * Refactored to use the new modular architecture.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Creates the custom menu when the spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
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
 * Gets called when the user selects the 'Push Data to Sheets' item in the menu.
 * Pushes data from the current spreadsheet to specific sheets in two target spreadsheets
 * (NAHS Criteria Sheet and NAMS 2024-25 Criteria Sheet).
 * Now uses the refactored DataPusher class.
 */
function pushDataToSheets() {
  const timer = AppLogger.startTimer('pushDataToSheets_menu');
  
  try {
    AppLogger.operationStart('pushDataToSheets (menu)', {
      trigger: 'user_menu'
    });

    // Use the refactored DataPusher
    const results = DataPusher.pushAllData();
    
    // Check if all operations were successful
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    if (failed === 0) {
      // Show custom dialog box with success message and links
      showSuccessDialog();
      AppLogger.operationSuccess('pushDataToSheets (menu)', {
        total: results.length,
        successful,
        failed
      }, timer.stop());
    } else {
      // Show error dialog with details
      showErrorDialog(results);
      AppLogger.warn('pushDataToSheets (menu) completed with failures', {
        total: results.length,
        successful,
        failed
      });
    }

  } catch (error) {
    timer.stop();
    const errorMessage = ErrorHandler.handle(error, 'pushDataToSheets (menu)');
    AppLogger.operationFailure('pushDataToSheets (menu)', error);
    
    SpreadsheetApp.getUi().alert(`An error occurred: ${errorMessage}`);
  }
}

/**
 * Shows a custom success dialog with hyperlinks.
 * Now uses configuration-driven links.
 */
function showSuccessDialog() {
  try {
    const htmlContent = DataPusher.createSuccessDialogContent();
    
    const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(400)
      .setHeight(200);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Data Push Successful");
    
    AppLogger.info('Success dialog displayed');
    
  } catch (error) {
    AppLogger.error('Failed to show success dialog', error);
    SpreadsheetApp.getUi().alert('Data was pushed successfully to the reports.');
  }
}

/**
 * Shows an error dialog with details about failed operations
 * @param {Array<Object>} results - Array of operation results
 */
function showErrorDialog(results) {
  try {
    const failed = results.filter(r => !r.success);
    const successful = results.filter(r => r.success);
    
    let message = `Push completed with ${successful.length} successful and ${failed.length} failed operations.\n\n`;
    
    if (failed.length > 0) {
      message += "Failed operations:\n";
      failed.forEach(result => {
        message += `• ${result.sourceSheet}: ${result.error}\n`;
      });
    }
    
    if (successful.length > 0) {
      message += "\nSuccessful operations:\n";
      successful.forEach(result => {
        message += `• ${result.sourceSheet}\n`;
      });
    }
    
    SpreadsheetApp.getUi().alert("Data Push Results", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger.info('Error dialog displayed', {
      successful: successful.length,
      failed: failed.length
    });
    
  } catch (error) {
    AppLogger.error('Failed to show error dialog', error);
    SpreadsheetApp.getUi().alert('Some operations failed. Check the logs for details.');
  }
}

/**
 * Shows the current push data status
 */
function showPushDataStatus() {
  try {
    AppLogger.operationStart('showPushDataStatus');
    
    const status = DataPusher.getPushDataStatus();
    
    let message = `Push Data Status (${DateUtils.formatDate()}):\n\n`;
    
    status.sourceSheets.forEach(sheet => {
      if (sheet.error) {
        message += `❌ ${sheet.sheetName}: ERROR - ${sheet.error}\n`;
      } else {
        message += `✅ ${sheet.sheetName}:\n`;
        message += `   • Data: ${sheet.currentRowCount} rows, ${sheet.currentColumnCount} columns\n`;
        message += `   • Range: ${sheet.range}\n`;
        message += `   • Targets: ${sheet.targetCount} configured\n`;
        
        const accessibleTargets = sheet.targets.filter(t => t.accessible).length;
        if (accessibleTargets < sheet.targetCount) {
          message += `   ⚠️ Warning: ${sheet.targetCount - accessibleTargets} targets not accessible\n`;
        }
        message += '\n';
      }
    });
    
    SpreadsheetApp.getUi().alert("Push Data Status", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger.operationSuccess('showPushDataStatus');
    
  } catch (error) {
    AppLogger.operationFailure('showPushDataStatus', error);
    SpreadsheetApp.getUi().alert(`Error getting push data status: ${error.message}`);
  }
}

/**
 * Shows the current email processing status
 */
function showEmailProcessingStatus() {
  try {
    AppLogger.operationStart('showEmailProcessingStatus');
    
    const status = EmailProcessor.getProcessingStatus();
    
    let message = `Email Processing Status (${DateUtils.formatDate()}):\n\n`;
    
    status.configurations.forEach(config => {
      if (config.error) {
        message += `❌ ${config.sheetName}: ERROR - ${config.error}\n`;
      } else {
        message += `${config.labelExists ? '✅' : '❌'} ${config.sheetName}:\n`;
        message += `   • Label: ${config.labelExists ? 'Found' : 'Not Found'}\n`;
        message += `   • Emails: ${config.emailCount}\n`;
        if (config.latestEmailDate) {
          message += `   • Latest: ${DateUtils.formatDate(config.latestEmailDate)}\n`;
        }
        message += `   • Range: ${config.rangeToClear}\n\n`;
      }
    });
    
    SpreadsheetApp.getUi().alert("Email Processing Status", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger.operationSuccess('showEmailProcessingStatus');
    
  } catch (error) {
    AppLogger.operationFailure('showEmailProcessingStatus', error);
    SpreadsheetApp.getUi().alert(`Error getting email processing status: ${error.message}`);
  }
}

/**
 * Shows system test results
 */
function showSystemTestResults() {
  try {
    AppLogger.operationStart('showSystemTestResults');
    
    const results = Utils.runSystemTests();
    
    let message = `System Test Results (${DateUtils.formatDate()}):\n\n`;
    message += `Overall Status: ${results.overall}\n\n`;
    
    // Summary of test categories
    Object.entries(results.tests).forEach(([testName, testResult]) => {
      if (testResult.error) {
        message += `❌ ${testName}: ERROR\n`;
      } else if (testName === 'emailProcessorDryRun') {
        message += `${testResult.valid ? '✅' : '⚠️'} ${testName}: ${testResult.valid ? 'PASS' : 'ISSUES'}\n`;
      } else {
        message += `✅ ${testName}: PASS\n`;
      }
    });
    
    if (results.overall !== 'PASS') {
      message += '\nSee console logs for detailed error information.';
    }
    
    SpreadsheetApp.getUi().alert("System Test Results", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    AppLogger.operationSuccess('showSystemTestResults', { overall: results.overall });
    
  } catch (error) {
    AppLogger.operationFailure('showSystemTestResults', error);
    SpreadsheetApp.getUi().alert(`Error running system tests: ${error.message}`);
  }
}

/**
 * Legacy function for backward compatibility
 * Updates the target sheet with new data, clearing old data and appending a timestamp note in cell A1.
 * 
 * @deprecated Use SheetService.updateSheet() instead
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet to update.
 * @param {any[][]} data - The data to write to the target sheet. Each sub-array represents a row.
 * @throws Will throw an error if the target sheet is not found or if other issues occur during the update process.
 */
function updateTargetSheet(sheet, data) {
  try {
    AppLogger.warn('Using deprecated updateTargetSheet function');
    
    if (!sheet) {
      throw new Error("Target sheet not found!");
    }

    // Clear data from row 2 down
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getMaxColumns()).clearContent();
    }

    // Insert new data starting at row 2
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
    }

    // Add a note in cell A1 with the update timestamp
    const timestampNote = DateUtils.createScriptTimestampNote();
    sheet.getRange("A1").setNote(timestampNote);

  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'updateTargetSheet (legacy)');
    throw error;
  }
}
