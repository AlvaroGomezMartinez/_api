/**
 * Email processor for the NISD API project.
 * Handles automated data processing from Gmail attachments to Google Sheets.
 * Compatible with Google Apps Script V8 runtime.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Processes all configured email labels and updates corresponding sheets
 * This is the main entry point for automated email processing
 * @returns {Array<Object>} Array of processing results for each configuration
 */
function EmailProcessor_processAllConfigs() {
  var timer = AppLogger_startTimer('processAllConfigs');
  
  try {
    AppLogger_operationStart('processAllConfigs', {
      configCount: CONFIG.EMAIL_CONFIGS.length
    });
    
    // Validate all configurations before processing
    EmailProcessor__validateAllConfigurations();
    
    var results = [];
    
    // Process each configuration sequentially to avoid rate limiting
    for (var i = 0; i < CONFIG.EMAIL_CONFIGS.length; i++) {
      var config = CONFIG.EMAIL_CONFIGS[i];
      var configContext = 'config[' + i + ']_' + config.sheetName;
      
      try {
        AppLogger_info('Processing configuration ' + (i + 1) + '/' + CONFIG.EMAIL_CONFIGS.length, {
          sheetName: config.sheetName,
          label: config.label
        });
        
        var result = EmailProcessor_processSingleConfig(config, configContext);
        
        results.push({
          success: true,
          config: config.sheetName,
          label: config.label,
          result: result
        });
        
      } catch (error) {
        var errorMessage = ErrorHandler_handle(error, 'Processing ' + config.sheetName, {
          configIndex: i,
          label: config.label
        });
        
        results.push({
          success: false,
          config: config.sheetName,
          label: config.label,
          error: errorMessage
        });
      }
      
      // Small delay between configurations to prevent rate limiting
      if (i < CONFIG.EMAIL_CONFIGS.length - 1) {
        Utilities.sleep(500);
      }
    }
    
    // Log batch summary
    AppLogger_batchSummary('processAllConfigs', results);
    
    AppLogger_operationSuccess('processAllConfigs', {
      total: results.length,
      successful: results.filter(function(r) { return r.success; }).length,
      failed: results.filter(function(r) { return !r.success; }).length
    }, timer.stop());
    
    return results;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('processAllConfigs', error);
    throw error;
  }
}

/**
 * Processes a single email configuration
 * @param {Object} config - The email configuration object
 * @param {string} context - Context for error messages
 * @returns {Object} Processing result with metadata
 * @throws {Error} If processing fails
 */
function EmailProcessor_processSingleConfig(config, context) {
  context = context || 'Single config processing';
  var timer = AppLogger_startTimer('processSingleConfig_' + config.sheetName);
  
  try {
    AppLogger_operationStart('processSingleConfig', {
      sheetName: config.sheetName,
      label: config.label,
      context: context
    });
    
    // Validate the configuration
    Validators_validateEmailConfig(config, context);
    
    // Step 1: Get the latest email
    var message = EmailService_getLatestEmailByLabel(config.label);
    
    // Step 2: Extract Excel attachment
    var attachment = EmailService_getExcelAttachment(message, context);
    
    // Step 3: Process Excel data
    var data = DriveService_processExcelData(attachment, context);
    
    // Step 4: Update the target sheet
    var updateResult = SheetService_updateSheet(
      CONFIG.SPREADSHEETS.MAIN,
      config.sheetName,
      config.rangeToClear,
      data,
      context
    );
    
    var result = {
      spreadsheetId: updateResult.spreadsheetId,
      sheetName: updateResult.sheetName,
      rowsInserted: updateResult.rowsInserted,
      columnsInserted: updateResult.columnsInserted,
      rangeToClear: updateResult.rangeToClear,
      timestamp: updateResult.timestamp,
      emailSubject: message.getSubject(),
      emailDate: message.getDate(),
      attachmentName: attachment.getName(),
      attachmentSize: attachment.getSize(),
      label: config.label
    };
    
    AppLogger_operationSuccess('processSingleConfig', result, timer.stop());
    return result;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('processSingleConfig', error, {
      sheetName: config.sheetName,
      context: context
    });
    throw error;
  }
}

/**
 * Validates all email configurations before processing
 * @private
 * @throws {Error} If any configuration is invalid
 */
function EmailProcessor__validateAllConfigurations() {
  AppLogger_info('Validating all email configurations');
  
  if (!CONFIG.EMAIL_CONFIGS || CONFIG.EMAIL_CONFIGS.length === 0) {
    throw ErrorHandler_createError(
      'No email configurations found',
      ERROR_CODES.MISSING_PARAMETERS
    );
  }
  
  // Validate main spreadsheet exists
  SheetService_getSpreadsheetMetadata(CONFIG.SPREADSHEETS.MAIN);
  
  // Validate each configuration
  CONFIG.EMAIL_CONFIGS.forEach(function(config, index) {
    try {
      Validators_validateEmailConfig(config, 'CONFIG.EMAIL_CONFIGS[' + index + ']');
      
      // Check if Gmail label exists
      if (!EmailService_labelExists(config.label)) {
        throw ErrorHandler_createError(
          'Gmail label does not exist: ' + config.label,
          ERROR_CODES.LABEL_NOT_FOUND,
          { labelName: config.label }
        );
      }
      
    } catch (error) {
      throw ErrorHandler_createError(
        'Configuration validation failed at index ' + index,
        ERROR_CODES.MISSING_PARAMETERS,
        { 
          configIndex: index,
          config: config,
          originalError: error.message
        }
      );
    }
  });
  
  // Validate that all target sheets exist
  var requiredSheets = CONFIG.EMAIL_CONFIGS.map(function(config) { return config.sheetName; });
  SheetService_validateRequiredSheets(
    CONFIG.SPREADSHEETS.MAIN,
    requiredSheets,
    'Email processor validation'
  );
  
  AppLogger_info('All email configurations validated successfully', {
    configCount: CONFIG.EMAIL_CONFIGS.length,
    targetSheets: requiredSheets
  });
}

/**
 * Gets processing status for all configurations
 * @returns {Object} Status information for each configuration
 */
function EmailProcessor_getProcessingStatus() {
  try {
    var status = {
      timestamp: DateUtils_getCurrentTimestamp(),
      configurations: []
    };
    
    CONFIG.EMAIL_CONFIGS.forEach(function(config, index) {
      try {
        var configStatus = {
          index: index,
          sheetName: config.sheetName,
          label: config.label,
          labelExists: EmailService_labelExists(config.label),
          emailCount: EmailService_getEmailCountByLabel(config.label),
          latestEmailDate: EmailService_getLatestEmailDate(config.label),
          rangeToClear: config.rangeToClear
        };
        
        status.configurations.push(configStatus);
        
      } catch (error) {
        status.configurations.push({
          index: index,
          sheetName: config.sheetName,
          label: config.label,
          error: error.message
        });
      }
    });
    
    return status;
    
  } catch (error) {
    AppLogger_error('Failed to get processing status', error);
    throw error;
  }
}

/**
 * Processes emails by specific label (for individual testing)
 * @param {string} labelName - The Gmail label to process
 * @returns {Object} Processing result
 * @throws {Error} If processing fails
 */
function EmailProcessor_processSpecificLabel(labelName) {
  try {
    AppLogger_operationStart('processSpecificLabel', { labelName: labelName });
    
    // Find the configuration for this label
    var config = null;
    for (var i = 0; i < CONFIG.EMAIL_CONFIGS.length; i++) {
      if (CONFIG.EMAIL_CONFIGS[i].label === labelName) {
        config = CONFIG.EMAIL_CONFIGS[i];
        break;
      }
    }
    
    if (!config) {
      throw ErrorHandler_createError(
        'No configuration found for label: ' + labelName,
        ERROR_CODES.MISSING_PARAMETERS,
        { 
          labelName: labelName, 
          availableLabels: CONFIG.EMAIL_CONFIGS.map(function(c) { return c.label; })
        }
      );
    }
    
    var result = EmailProcessor_processSingleConfig(config, 'processSpecificLabel_' + labelName);
    
    AppLogger_operationSuccess('processSpecificLabel', result);
    return result;
    
  } catch (error) {
    AppLogger_operationFailure('processSpecificLabel', error, { labelName: labelName });
    throw error;
  }
}

/**
 * Dry run processing to validate configurations without making changes
 * @returns {Object} Validation results
 */
function EmailProcessor_dryRun() {
  try {
    AppLogger_operationStart('dryRun');
    
    var results = {
      timestamp: DateUtils_getCurrentTimestamp(),
      valid: true,
      errors: [],
      warnings: [],
      configurations: []
    };
    
    CONFIG.EMAIL_CONFIGS.forEach(function(config, index) {
      var configResult = {
        index: index,
        sheetName: config.sheetName,
        label: config.label,
        valid: true,
        checks: {}
      };
      
      try {
        // Check configuration structure
        Validators_validateEmailConfig(config, 'dryRun.config[' + index + ']');
        configResult.checks.configStructure = 'PASS';
        
        // Check if label exists
        configResult.checks.labelExists = EmailService_labelExists(config.label) ? 'PASS' : 'FAIL';
        if (configResult.checks.labelExists === 'FAIL') {
          configResult.valid = false;
          results.errors.push('Label does not exist: ' + config.label);
        }
        
        // Check if emails exist
        var emailCount = EmailService_getEmailCountByLabel(config.label);
        configResult.checks.hasEmails = emailCount > 0 ? 'PASS' : 'WARN';
        if (configResult.checks.hasEmails === 'WARN') {
          results.warnings.push('No emails found for label: ' + config.label);
        }
        
        // Check range format
        configResult.checks.rangeFormat = 'PASS'; // Already validated in validateEmailConfig
        
      } catch (error) {
        configResult.valid = false;
        configResult.error = error.message;
        results.errors.push('Config ' + index + ' (' + config.sheetName + '): ' + error.message);
      }
      
      if (!configResult.valid) {
        results.valid = false;
      }
      
      results.configurations.push(configResult);
    });
    
    AppLogger_operationSuccess('dryRun', {
      overall: results.valid ? 'PASS' : 'FAIL',
      errorCount: results.errors.length,
      warningCount: results.warnings.length
    });
    
    return results;
    
  } catch (error) {
    AppLogger_operationFailure('dryRun', error);
    throw error;
  }
}

/**
 * EmailProcessor object for backward compatibility and easier access
 */
var EmailProcessor = {
  processAllConfigs: EmailProcessor_processAllConfigs,
  processSingleConfig: EmailProcessor_processSingleConfig,
  getProcessingStatus: EmailProcessor_getProcessingStatus,
  processSpecificLabel: EmailProcessor_processSpecificLabel,
  dryRun: EmailProcessor_dryRun,
  _validateAllConfigurations: EmailProcessor__validateAllConfigurations
};
