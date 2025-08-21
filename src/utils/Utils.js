/**
 * Utility functions for the NISD API project.
 * Contains helper functions for logging, system info, connectivity tests, and formatting.
 * Compatible with Google Apps Script V8 runtime.
 *
 * @file Utility functions for NISD API project.
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * @typedef {Object} SystemInfo
 * @property {string} timestamp - Current timestamp.
 * @property {string} timezone - Script timezone.
 * @property {string} userEmail - Active user's email.
 * @property {string} scriptTimeZone - Configured timezone.
 * @property {Object} quotas - Quota information.
 * @property {number} quotas.emailQuota - Remaining daily email quota.
 * @property {number} quotas.driveQuota - Used Drive storage.
 */

/**
 * @typedef {Object} EmailConnectivityTestResult
 * @property {string} timestamp - Timestamp of test.
 * @property {Object} tests - Test results by label/sheet.
 */

/**
 * @typedef {Object} SpreadsheetConnectivityTestResult
 * @property {string} timestamp - Timestamp of test.
 * @property {Object} tests - Test results for spreadsheets.
 */

/**
 * @typedef {Object} SystemTestResults
 * @property {string} timestamp - Timestamp of test.
 * @property {string} overall - Overall status (PASS/FAIL/WARN).
 * @property {Object} tests - Individual test results.
 */

/**
 * Higher-order function to wrap business logic with standard error handling and logging.
 * @template T
 * @param {function(...*):T} fn - The function containing business logic.
 * @param {string} operationName - Name of the operation for logging.
 * @param {Object} [context] - Optional context object for logging.
 * @returns {function(...*):T} Wrapped function with error handling and logging.
 * @example
 * const safeFn = withOperationLogging(myFunction, 'myOperation');
 * safeFn(arg1, arg2);
 */
function withOperationLogging(fn, operationName, context) {
  return function(...args) {
    var timer = AppLogger_startTimer(operationName);
    try {
      AppLogger_operationStart(operationName, context);
      var result = fn.apply(this, args);
      AppLogger_operationSuccess(operationName, result, timer.stop());
      return result;
    } catch (error) {
      AppLogger_operationFailure(operationName, error);
      ErrorHandler_handle(error, operationName, context);
      throw error;
    }
  };
}

/**
 * Lists all Gmail labels (utility function for development/debugging).
 * Used to get the list of Gmail labels for configuration.
 * @returns {string[]} Array of Gmail label names.
 */
function Utils_listGmailLabels() {
  try {
    AppLogger_operationStart('listGmailLabels');
    
    var labels = GmailApp.getUserLabels();
    var labelNames = labels.map(function(label) { return label.getName(); });
    
    if (labelNames.length === 0) {
      AppLogger_warn('No labels found in Gmail account');
      Logger.log("No labels found in your Gmail account.");
    } else {
      AppLogger_info('Gmail labels retrieved', { labelCount: labelNames.length });
      Logger.log("Your Gmail labels:");
      labelNames.forEach(function(label) { Logger.log(label); });
    }
    
    AppLogger_operationSuccess('listGmailLabels', { labelCount: labelNames.length });
    return labelNames;
    
  } catch (error) {
    AppLogger_operationFailure('listGmailLabels', error);
    throw error;
  }
}

/**
 * Gets system information for debugging.
 * @returns {SystemInfo} System information object.
 */
function Utils_getSystemInfo() {
  try {
    var info = {
      timestamp: DateUtils_getCurrentTimestamp(),
      timezone: Session.getScriptTimeZone(),
      userEmail: Session.getActiveUser().getEmail(),
      scriptTimeZone: CONFIG.SETTINGS.timezone,
      quotas: {
        emailQuota: MailApp.getRemainingDailyQuota(),
        driveQuota: DriveApp.getStorageUsed()
      }
    };
    
    AppLogger_info('System information retrieved', info);
    return info;
    
  } catch (error) {
    AppLogger_error('Failed to get system information', error);
    throw error;
  }
}

/**
 * Tests email service connectivity.
 * Checks Gmail access and configured labels.
 * @returns {EmailConnectivityTestResult} Test results object.
 */
function Utils_testEmailConnectivity() {
  try {
    AppLogger_operationStart('testEmailConnectivity');
    
    var results = {
      timestamp: DateUtils_getCurrentTimestamp(),
      tests: {}
    };
    
    // Test Gmail access
    try {
      var labels = GmailApp.getUserLabels();
      results.tests.gmailAccess = {
        status: 'PASS',
        labelCount: labels.length
      };
    } catch (error) {
      results.tests.gmailAccess = {
        status: 'FAIL',
        error: error.message
      };
    }
    
    // Test each configured label
    results.tests.configuredLabels = {};
    CONFIG.EMAIL_CONFIGS.forEach(function(config) {
      try {
        var exists = EmailService_labelExists(config.label);
        var emailCount = exists ? EmailService_getEmailCountByLabel(config.label) : 0;
        
        results.tests.configuredLabels[config.sheetName] = {
          status: exists ? 'PASS' : 'FAIL',
          labelName: config.label,
          exists: exists,
          emailCount: emailCount
        };
      } catch (error) {
        results.tests.configuredLabels[config.sheetName] = {
          status: 'ERROR',
          labelName: config.label,
          error: error.message
        };
      }
    });
    
    AppLogger_operationSuccess('testEmailConnectivity', results);
    return results;
    
  } catch (error) {
    AppLogger_operationFailure('testEmailConnectivity', error);
    throw error;
  }
}

/**
 * Tests spreadsheet connectivity.
 * Checks main and target spreadsheets.
 * @returns {SpreadsheetConnectivityTestResult} Test results object.
 */
function Utils_testSpreadsheetConnectivity() {
  try {
    AppLogger_operationStart('testSpreadsheetConnectivity');
    
    var results = {
      timestamp: DateUtils_getCurrentTimestamp(),
      tests: {}
    };
    
    // Test main spreadsheet
    try {
      var metadata = SheetService_getSpreadsheetMetadata(CONFIG.SPREADSHEETS.MAIN);
      results.tests.mainSpreadsheet = {
        status: 'PASS',
        id: CONFIG.SPREADSHEETS.MAIN,
        name: metadata.name,
        sheetCount: metadata.sheetCount
      };
    } catch (error) {
      results.tests.mainSpreadsheet = {
        status: 'FAIL',
        id: CONFIG.SPREADSHEETS.MAIN,
        error: error.message
      };
    }
    
    // Test target spreadsheets
    results.tests.targetSpreadsheets = {};
    
    var targetIds = new Set();
    Object.values(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).forEach(function(config) {
      config.targets.forEach(function(target) {
        targetIds.add(target.spreadsheetId);
      });
    });
    
    targetIds.forEach(function(spreadsheetId) {
      try {
        var metadata = SheetService_getSpreadsheetMetadata(spreadsheetId);
        results.tests.targetSpreadsheets[spreadsheetId] = {
          status: 'PASS',
          name: metadata.name,
          sheetCount: metadata.sheetCount
        };
      } catch (error) {
        results.tests.targetSpreadsheets[spreadsheetId] = {
          status: 'FAIL',
          error: error.message
        };
      }
    });
    
    AppLogger_operationSuccess('testSpreadsheetConnectivity', results);
    return results;
    
  } catch (error) {
    AppLogger_operationFailure('testSpreadsheetConnectivity', error);
    throw error;
  }
}

/**
 * Runs a comprehensive system test.
 * Runs system info, email, spreadsheet, and data push tests.
 * @returns {SystemTestResults} Complete test results object.
 */
function Utils_runSystemTests() {
  try {
    AppLogger_operationStart('runSystemTests');
    
    var results = {
      timestamp: DateUtils_getCurrentTimestamp(),
      overall: 'PASS',
      tests: {}
    };
    
    // Run individual tests
    try {
      results.tests.systemInfo = Utils_getSystemInfo();
    } catch (error) {
      results.tests.systemInfo = { error: error.message };
      results.overall = 'FAIL';
    }
    
    try {
      results.tests.emailConnectivity = Utils_testEmailConnectivity();
    } catch (error) {
      results.tests.emailConnectivity = { error: error.message };
      results.overall = 'FAIL';
    }
    
    try {
      results.tests.spreadsheetConnectivity = Utils_testSpreadsheetConnectivity();
    } catch (error) {
      results.tests.spreadsheetConnectivity = { error: error.message };
      results.overall = 'FAIL';
    }
    
    // Run dry run test
    try {
      results.tests.emailProcessorDryRun = EmailProcessor_dryRun();
      if (!results.tests.emailProcessorDryRun.valid) {
        results.overall = 'WARN';
      }
    } catch (error) {
      results.tests.emailProcessorDryRun = { error: error.message };
      results.overall = 'FAIL';
    }
    
    // Test push data status
    try {
      results.tests.pushDataStatus = DataPusher_getPushDataStatus();
    } catch (error) {
      results.tests.pushDataStatus = { error: error.message };
      results.overall = 'FAIL';
    }
    
    AppLogger_operationSuccess('runSystemTests', {
      overall: results.overall,
      testCount: Object.keys(results.tests).length
    });
    
    return results;
    
  } catch (error) {
    AppLogger_operationFailure('runSystemTests', error);
    throw error;
  }
}

/**
 * Clears all logs (for development/debugging).
 * @returns {void}
 */
function Utils_clearLogs() {
  try {
    console.clear();
    AppLogger_info('Console logs cleared');
  } catch (error) {
    AppLogger_error('Failed to clear logs', error);
  }
}

/**
 * Formats data for display in logs.
 * @param {*} data - Data to format.
 * @param {number} [maxLength=100] - Maximum length for string representation.
 * @returns {string} Formatted data string.
 */
function Utils_formatDataForLog(data, maxLength) {
  maxLength = maxLength || 100;
  
  try {
    var formatted = JSON.stringify(data, null, 2);
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength) + '...';
    }
    return formatted;
  } catch (error) {
    return String(data);
  }
}

/**
 * Gets configuration summary.
 * @returns {Object} Configuration summary object.
 */
function Utils_getConfigurationSummary() {
  return {
    timestamp: DateUtils_getCurrentTimestamp(),
    spreadsheets: {
      main: CONFIG.SPREADSHEETS.MAIN,
      targetCount: Object.keys(CONFIG.SPREADSHEETS).length - 1
    },
    emailConfigs: {
      count: CONFIG.EMAIL_CONFIGS.length,
      sheets: CONFIG.EMAIL_CONFIGS.map(function(c) { return c.sheetName; })
    },
    pushConfigs: {
      sourceSheetCount: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).length,
      sourceSheets: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets)
    },
    settings: CONFIG.SETTINGS
  };
}

/**
 * Utils object for backward compatibility and easier access.
 * @namespace Utils
 */
var Utils = {
  listGmailLabels: Utils_listGmailLabels,
  getSystemInfo: Utils_getSystemInfo,
  testEmailConnectivity: Utils_testEmailConnectivity,
  testSpreadsheetConnectivity: Utils_testSpreadsheetConnectivity,
  runSystemTests: Utils_runSystemTests,
  clearLogs: Utils_clearLogs,
  formatDataForLog: Utils_formatDataForLog,
  getConfigurationSummary: Utils_getConfigurationSummary
};
