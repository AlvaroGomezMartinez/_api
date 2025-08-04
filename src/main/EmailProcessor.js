/**
 * Email processor for the NISD API project.
 * Handles automated data processing from Gmail attachments to Google Sheets.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Email processor class for automated data updates
 */
class EmailProcessor {
  
  /**
   * Processes all configured email labels and updates corresponding sheets
   * This is the main entry point for automated email processing
   * @returns {Array<Object>} Array of processing results for each configuration
   */
  static async processAllConfigs() {
    const timer = AppLogger.startTimer('processAllConfigs');
    
    try {
      AppLogger.operationStart('processAllConfigs', {
        configCount: CONFIG.EMAIL_CONFIGS.length
      });
      
      // Validate all configurations before processing
      this._validateAllConfigurations();
      
      const results = [];
      
      // Process each configuration sequentially to avoid rate limiting
      for (let i = 0; i < CONFIG.EMAIL_CONFIGS.length; i++) {
        const config = CONFIG.EMAIL_CONFIGS[i];
        const configContext = `config[${i}]_${config.sheetName}`;
        
        try {
          AppLogger.info(`Processing configuration ${i + 1}/${CONFIG.EMAIL_CONFIGS.length}`, {
            sheetName: config.sheetName,
            label: config.label
          });
          
          const result = await this.processSingleConfig(config, configContext);
          
          results.push({
            success: true,
            config: config.sheetName,
            label: config.label,
            result
          });
          
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error, `Processing ${config.sheetName}`, {
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
      AppLogger.batchSummary('processAllConfigs', results);
      
      AppLogger.operationSuccess('processAllConfigs', {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }, timer.stop());
      
      return results;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('processAllConfigs', error);
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
  static async processSingleConfig(config, context = 'Single config processing') {
    const timer = AppLogger.startTimer(`processSingleConfig_${config.sheetName}`);
    
    try {
      AppLogger.operationStart('processSingleConfig', {
        sheetName: config.sheetName,
        label: config.label,
        context
      });
      
      // Validate the configuration
      Validators.validateEmailConfig(config, context);
      
      // Step 1: Get the latest email
      const message = EmailService.getLatestEmailByLabel(config.label);
      
      // Step 2: Extract Excel attachment
      const attachment = EmailService.getExcelAttachment(message, context);
      
      // Step 3: Process Excel data
      const data = DriveService.processExcelData(attachment, context);
      
      // Step 4: Update the target sheet
      const updateResult = SheetService.updateSheet(
        CONFIG.SPREADSHEETS.MAIN,
        config.sheetName,
        config.rangeToClear,
        data,
        context
      );
      
      const result = {
        ...updateResult,
        emailSubject: message.getSubject(),
        emailDate: message.getDate(),
        attachmentName: attachment.getName(),
        attachmentSize: attachment.getSize(),
        label: config.label
      };
      
      AppLogger.operationSuccess('processSingleConfig', result, timer.stop());
      return result;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('processSingleConfig', error, {
        sheetName: config.sheetName,
        context
      });
      throw error;
    }
  }
  
  /**
   * Validates all email configurations before processing
   * @private
   * @throws {Error} If any configuration is invalid
   */
  static _validateAllConfigurations() {
    AppLogger.info('Validating all email configurations');
    
    if (!CONFIG.EMAIL_CONFIGS || CONFIG.EMAIL_CONFIGS.length === 0) {
      throw ErrorHandler.createError(
        'No email configurations found',
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    // Validate main spreadsheet exists
    SheetService.getSpreadsheetMetadata(CONFIG.SPREADSHEETS.MAIN);
    
    // Validate each configuration
    CONFIG.EMAIL_CONFIGS.forEach((config, index) => {
      try {
        Validators.validateEmailConfig(config, `CONFIG.EMAIL_CONFIGS[${index}]`);
        
        // Check if Gmail label exists
        if (!EmailService.labelExists(config.label)) {
          throw ErrorHandler.createError(
            `Gmail label does not exist: ${config.label}`,
            ERROR_CODES.LABEL_NOT_FOUND,
            { labelName: config.label }
          );
        }
        
      } catch (error) {
        throw ErrorHandler.createError(
          `Configuration validation failed at index ${index}`,
          ERROR_CODES.MISSING_PARAMETERS,
          { 
            configIndex: index,
            config,
            originalError: error.message
          }
        );
      }
    });
    
    // Validate that all target sheets exist
    const requiredSheets = CONFIG.EMAIL_CONFIGS.map(config => config.sheetName);
    SheetService.validateRequiredSheets(
      CONFIG.SPREADSHEETS.MAIN,
      requiredSheets,
      'Email processor validation'
    );
    
    AppLogger.info('All email configurations validated successfully', {
      configCount: CONFIG.EMAIL_CONFIGS.length,
      targetSheets: requiredSheets
    });
  }
  
  /**
   * Gets processing status for all configurations
   * @returns {Object} Status information for each configuration
   */
  static getProcessingStatus() {
    try {
      const status = {
        timestamp: DateUtils.getCurrentTimestamp(),
        configurations: []
      };
      
      CONFIG.EMAIL_CONFIGS.forEach((config, index) => {
        try {
          const configStatus = {
            index,
            sheetName: config.sheetName,
            label: config.label,
            labelExists: EmailService.labelExists(config.label),
            emailCount: EmailService.getEmailCountByLabel(config.label),
            latestEmailDate: EmailService.getLatestEmailDate(config.label),
            rangeToClear: config.rangeToClear
          };
          
          status.configurations.push(configStatus);
          
        } catch (error) {
          status.configurations.push({
            index,
            sheetName: config.sheetName,
            label: config.label,
            error: error.message
          });
        }
      });
      
      return status;
      
    } catch (error) {
      AppLogger.error('Failed to get processing status', error);
      throw error;
    }
  }
  
  /**
   * Processes emails by specific label (for individual testing)
   * @param {string} labelName - The Gmail label to process
   * @returns {Object} Processing result
   * @throws {Error} If processing fails
   */
  static async processSpecificLabel(labelName) {
    try {
      AppLogger.operationStart('processSpecificLabel', { labelName });
      
      // Find the configuration for this label
      const config = CONFIG.EMAIL_CONFIGS.find(c => c.label === labelName);
      
      if (!config) {
        throw ErrorHandler.createError(
          `No configuration found for label: ${labelName}`,
          ERROR_CODES.MISSING_PARAMETERS,
          { labelName, availableLabels: CONFIG.EMAIL_CONFIGS.map(c => c.label) }
        );
      }
      
      const result = await this.processSingleConfig(config, `processSpecificLabel_${labelName}`);
      
      AppLogger.operationSuccess('processSpecificLabel', result);
      return result;
      
    } catch (error) {
      AppLogger.operationFailure('processSpecificLabel', error, { labelName });
      throw error;
    }
  }
  
  /**
   * Dry run processing to validate configurations without making changes
   * @returns {Object} Validation results
   */
  static dryRun() {
    try {
      AppLogger.operationStart('dryRun');
      
      const results = {
        timestamp: DateUtils.getCurrentTimestamp(),
        valid: true,
        errors: [],
        warnings: [],
        configurations: []
      };
      
      CONFIG.EMAIL_CONFIGS.forEach((config, index) => {
        const configResult = {
          index,
          sheetName: config.sheetName,
          label: config.label,
          valid: true,
          checks: {}
        };
        
        try {
          // Check configuration structure
          Validators.validateEmailConfig(config, `dryRun.config[${index}]`);
          configResult.checks.configStructure = 'PASS';
          
          // Check if label exists
          configResult.checks.labelExists = EmailService.labelExists(config.label) ? 'PASS' : 'FAIL';
          if (configResult.checks.labelExists === 'FAIL') {
            configResult.valid = false;
            results.errors.push(`Label does not exist: ${config.label}`);
          }
          
          // Check if emails exist
          const emailCount = EmailService.getEmailCountByLabel(config.label);
          configResult.checks.hasEmails = emailCount > 0 ? 'PASS' : 'WARN';
          if (configResult.checks.hasEmails === 'WARN') {
            results.warnings.push(`No emails found for label: ${config.label}`);
          }
          
          // Check range format
          configResult.checks.rangeFormat = 'PASS'; // Already validated in validateEmailConfig
          
        } catch (error) {
          configResult.valid = false;
          configResult.error = error.message;
          results.errors.push(`Config ${index} (${config.sheetName}): ${error.message}`);
        }
        
        if (!configResult.valid) {
          results.valid = false;
        }
        
        results.configurations.push(configResult);
      });
      
      AppLogger.operationSuccess('dryRun', {
        overall: results.valid ? 'PASS' : 'FAIL',
        errorCount: results.errors.length,
        warningCount: results.warnings.length
      });
      
      return results;
      
    } catch (error) {
      AppLogger.operationFailure('dryRun', error);
      throw error;
    }
  }
}
