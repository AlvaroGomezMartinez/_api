/**
 * Utility functions for the NISD API project.
 * Contains helper functions that were previously in separate utility files.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Utility class for various helper functions
 */
class Utils {
  
  /**
   * Lists all Gmail labels (utility function for development/debugging)
   * This function was used to get the list of Gmail labels for configuration
   * @returns {Array<string>} Array of Gmail label names
   */
  static listGmailLabels() {
    try {
      AppLogger.operationStart('listGmailLabels');
      
      const labels = GmailApp.getUserLabels();
      const labelNames = labels.map(label => label.getName());
      
      if (labelNames.length === 0) {
        AppLogger.warn('No labels found in Gmail account');
        Logger.log("No labels found in your Gmail account.");
      } else {
        AppLogger.info('Gmail labels retrieved', { labelCount: labelNames.length });
        Logger.log("Your Gmail labels:");
        labelNames.forEach(label => Logger.log(label));
      }
      
      AppLogger.operationSuccess('listGmailLabels', { labelCount: labelNames.length });
      return labelNames;
      
    } catch (error) {
      AppLogger.operationFailure('listGmailLabels', error);
      throw error;
    }
  }
  
  /**
   * Gets system information for debugging
   * @returns {Object} System information
   */
  static getSystemInfo() {
    try {
      const info = {
        timestamp: DateUtils.getCurrentTimestamp(),
        timezone: Session.getScriptTimeZone(),
        userEmail: Session.getActiveUser().getEmail(),
        scriptTimeZone: CONFIG.SETTINGS.timezone,
        quotas: {
          emailQuota: MailApp.getRemainingDailyQuota(),
          driveQuota: DriveApp.getStorageUsed()
        }
      };
      
      AppLogger.info('System information retrieved', info);
      return info;
      
    } catch (error) {
      AppLogger.error('Failed to get system information', error);
      throw error;
    }
  }
  
  /**
   * Tests email service connectivity
   * @returns {Object} Test results
   */
  static testEmailConnectivity() {
    try {
      AppLogger.operationStart('testEmailConnectivity');
      
      const results = {
        timestamp: DateUtils.getCurrentTimestamp(),
        tests: {}
      };
      
      // Test Gmail access
      try {
        const labels = GmailApp.getUserLabels();
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
      CONFIG.EMAIL_CONFIGS.forEach(config => {
        try {
          const exists = EmailService.labelExists(config.label);
          const emailCount = exists ? EmailService.getEmailCountByLabel(config.label) : 0;
          
          results.tests.configuredLabels[config.sheetName] = {
            status: exists ? 'PASS' : 'FAIL',
            labelName: config.label,
            exists,
            emailCount
          };
        } catch (error) {
          results.tests.configuredLabels[config.sheetName] = {
            status: 'ERROR',
            labelName: config.label,
            error: error.message
          };
        }
      });
      
      AppLogger.operationSuccess('testEmailConnectivity', results);
      return results;
      
    } catch (error) {
      AppLogger.operationFailure('testEmailConnectivity', error);
      throw error;
    }
  }
  
  /**
   * Tests spreadsheet connectivity
   * @returns {Object} Test results
   */
  static testSpreadsheetConnectivity() {
    try {
      AppLogger.operationStart('testSpreadsheetConnectivity');
      
      const results = {
        timestamp: DateUtils.getCurrentTimestamp(),
        tests: {}
      };
      
      // Test main spreadsheet
      try {
        const metadata = SheetService.getSpreadsheetMetadata(CONFIG.SPREADSHEETS.MAIN);
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
      
      const targetIds = new Set();
      Object.values(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).forEach(config => {
        config.targets.forEach(target => {
          targetIds.add(target.spreadsheetId);
        });
      });
      
      targetIds.forEach(spreadsheetId => {
        try {
          const metadata = SheetService.getSpreadsheetMetadata(spreadsheetId);
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
      
      AppLogger.operationSuccess('testSpreadsheetConnectivity', results);
      return results;
      
    } catch (error) {
      AppLogger.operationFailure('testSpreadsheetConnectivity', error);
      throw error;
    }
  }
  
  /**
   * Runs a comprehensive system test
   * @returns {Object} Complete test results
   */
  static runSystemTests() {
    try {
      AppLogger.operationStart('runSystemTests');
      
      const results = {
        timestamp: DateUtils.getCurrentTimestamp(),
        overall: 'PASS',
        tests: {}
      };
      
      // Run individual tests
      try {
        results.tests.systemInfo = this.getSystemInfo();
      } catch (error) {
        results.tests.systemInfo = { error: error.message };
        results.overall = 'FAIL';
      }
      
      try {
        results.tests.emailConnectivity = this.testEmailConnectivity();
      } catch (error) {
        results.tests.emailConnectivity = { error: error.message };
        results.overall = 'FAIL';
      }
      
      try {
        results.tests.spreadsheetConnectivity = this.testSpreadsheetConnectivity();
      } catch (error) {
        results.tests.spreadsheetConnectivity = { error: error.message };
        results.overall = 'FAIL';
      }
      
      // Run dry run test
      try {
        results.tests.emailProcessorDryRun = EmailProcessor.dryRun();
        if (!results.tests.emailProcessorDryRun.valid) {
          results.overall = 'WARN';
        }
      } catch (error) {
        results.tests.emailProcessorDryRun = { error: error.message };
        results.overall = 'FAIL';
      }
      
      // Test push data status
      try {
        results.tests.pushDataStatus = DataPusher.getPushDataStatus();
      } catch (error) {
        results.tests.pushDataStatus = { error: error.message };
        results.overall = 'FAIL';
      }
      
      AppLogger.operationSuccess('runSystemTests', {
        overall: results.overall,
        testCount: Object.keys(results.tests).length
      });
      
      return results;
      
    } catch (error) {
      AppLogger.operationFailure('runSystemTests', error);
      throw error;
    }
  }
  
  /**
   * Clears all logs (for development/debugging)
   */
  static clearLogs() {
    try {
      console.clear();
      AppLogger.info('Console logs cleared');
    } catch (error) {
      AppLogger.error('Failed to clear logs', error);
    }
  }
  
  /**
   * Formats data for display in logs
   * @param {any} data - Data to format
   * @param {number} maxLength - Maximum length for string representation
   * @returns {string} Formatted data string
   */
  static formatDataForLog(data, maxLength = 100) {
    try {
      let formatted = JSON.stringify(data, null, 2);
      if (formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength) + '...';
      }
      return formatted;
    } catch (error) {
      return String(data);
    }
  }
  
  /**
   * Gets configuration summary
   * @returns {Object} Configuration summary
   */
  static getConfigurationSummary() {
    return {
      timestamp: DateUtils.getCurrentTimestamp(),
      spreadsheets: {
        main: CONFIG.SPREADSHEETS.MAIN,
        targetCount: Object.keys(CONFIG.SPREADSHEETS).length - 1
      },
      emailConfigs: {
        count: CONFIG.EMAIL_CONFIGS.length,
        sheets: CONFIG.EMAIL_CONFIGS.map(c => c.sheetName)
      },
      pushConfigs: {
        sourceSheetCount: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).length,
        sourceSheets: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets)
      },
      settings: CONFIG.SETTINGS
    };
  }
}
