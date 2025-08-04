/**
 * Input validation utilities for the NISD API project.
 * Provides comprehensive validation functions for various data types and formats.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Validation utility class
 */
class Validators {
  
  /**
   * Validates a Google Spreadsheet ID
   * @param {string} id - The spreadsheet ID to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If the spreadsheet ID is invalid
   */
  static validateSpreadsheetId(id, context = 'Spreadsheet ID') {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw ErrorHandler.createError(
        `${context}: Invalid spreadsheet ID provided`,
        ERROR_CODES.MISSING_PARAMETERS,
        { provided: id, type: typeof id }
      );
    }
    
    // Basic format validation for Google Spreadsheet IDs
    const idPattern = /^[a-zA-Z0-9_-]{44}$/;
    if (!idPattern.test(id)) {
      AppLogger.warn(`${context}: Spreadsheet ID format may be invalid`, { id });
    }
  }
  
  /**
   * Validates a sheet name
   * @param {string} name - The sheet name to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If the sheet name is invalid
   */
  static validateSheetName(name, context = 'Sheet name') {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw ErrorHandler.createError(
        `${context}: Invalid sheet name provided`,
        ERROR_CODES.MISSING_PARAMETERS,
        { provided: name, type: typeof name }
      );
    }
  }
  
  /**
   * Validates an email configuration object
   * @param {Object} config - The email configuration to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If the configuration is invalid
   */
  static validateEmailConfig(config, context = 'Email configuration') {
    if (!config || typeof config !== 'object') {
      throw ErrorHandler.createError(
        `${context}: Configuration must be an object`,
        ERROR_CODES.MISSING_PARAMETERS,
        { provided: config, type: typeof config }
      );
    }
    
    const required = ['label', 'sheetName', 'rangeToClear'];
    ErrorHandler.validateRequired(config, required, context);
    
    // Validate specific fields
    this.validateSheetName(config.sheetName, `${context}.sheetName`);
    this.validateRange(config.rangeToClear, `${context}.rangeToClear`);
    this.validateGmailLabel(config.label, `${context}.label`);
  }
  
  /**
   * Validates a Gmail label name
   * @param {string} label - The Gmail label to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If the label is invalid
   */
  static validateGmailLabel(label, context = 'Gmail label') {
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      throw ErrorHandler.createError(
        `${context}: Invalid Gmail label provided`,
        ERROR_CODES.MISSING_PARAMETERS,
        { provided: label, type: typeof label }
      );
    }
  }
  
  /**
   * Validates a spreadsheet range
   * @param {string} range - The range to validate (e.g., "A2:O")
   * @param {string} context - Context for error messages
   * @throws {Error} If the range is invalid
   */
  static validateRange(range, context = 'Range') {
    if (!range || typeof range !== 'string' || range.trim().length === 0) {
      throw ErrorHandler.createError(
        `${context}: Invalid range provided`,
        ERROR_CODES.MISSING_PARAMETERS,
        { provided: range, type: typeof range }
      );
    }
    
    // Basic range format validation (e.g., A1:Z100, A2:O)
    const rangePattern = /^[A-Z]+\d*:[A-Z]+\d*$/;
    if (!rangePattern.test(range)) {
      AppLogger.warn(`${context}: Range format may be invalid`, { range });
    }
  }
  
  /**
   * Validates a data array for spreadsheet operations
   * @param {Array} data - The data array to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If the data is invalid
   */
  static validateDataArray(data, context = 'Data array') {
    if (!Array.isArray(data)) {
      throw ErrorHandler.createError(
        `${context}: Data must be an array`,
        ERROR_CODES.MISSING_PARAMETERS,
        { provided: typeof data }
      );
    }
    
    if (data.length === 0) {
      AppLogger.warn(`${context}: Data array is empty`);
      return;
    }
    
    // Validate that all rows have the same number of columns
    const expectedColumns = data[0].length;
    const inconsistentRows = data.filter((row, index) => {
      if (!Array.isArray(row)) {
        throw ErrorHandler.createError(
          `${context}: Row ${index} is not an array`,
          ERROR_CODES.MISSING_PARAMETERS,
          { rowIndex: index, rowType: typeof row }
        );
      }
      return row.length !== expectedColumns;
    });
    
    if (inconsistentRows.length > 0) {
      AppLogger.warn(`${context}: Inconsistent row lengths detected`, {
        expectedColumns,
        inconsistentRowCount: inconsistentRows.length
      });
    }
  }
  
  /**
   * Validates a push data configuration
   * @param {Object} config - The push data configuration to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If the configuration is invalid
   */
  static validatePushDataConfig(config, context = 'Push data configuration') {
    if (!config || typeof config !== 'object') {
      throw ErrorHandler.createError(
        `${context}: Configuration must be an object`,
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    ErrorHandler.validateRequired(config, ['range', 'targets'], context);
    
    this.validateRange(config.range, `${context}.range`);
    
    if (!Array.isArray(config.targets) || config.targets.length === 0) {
      throw ErrorHandler.createError(
        `${context}: Targets must be a non-empty array`,
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    // Validate each target
    config.targets.forEach((target, index) => {
      const targetContext = `${context}.targets[${index}]`;
      ErrorHandler.validateRequired(target, ['spreadsheetId', 'sheetName'], targetContext);
      this.validateSpreadsheetId(target.spreadsheetId, `${targetContext}.spreadsheetId`);
      this.validateSheetName(target.sheetName, `${targetContext}.sheetName`);
    });
  }
  
  /**
   * Validates an email attachment
   * @param {GoogleAppsScript.Gmail.GmailAttachment} attachment - The attachment to validate
   * @param {string} context - Context for error messages
   * @throws {Error} If the attachment is invalid
   */
  static validateEmailAttachment(attachment, context = 'Email attachment') {
    if (!attachment) {
      throw ErrorHandler.createError(
        `${context}: No attachment provided`,
        ERROR_CODES.ATTACHMENT_NOT_FOUND
      );
    }
    
    // Validate content type
    const contentType = attachment.getContentType();
    if (contentType !== MIME_TYPES.EXCEL) {
      throw ErrorHandler.createError(
        `${context}: Invalid attachment type. Expected Excel file.`,
        ERROR_CODES.ATTACHMENT_NOT_FOUND,
        { 
          providedType: contentType, 
          expectedType: MIME_TYPES.EXCEL,
          fileName: attachment.getName()
        }
      );
    }
  }
  
  /**
   * Validates a Google Apps Script sheet object
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to validate
   * @param {string} expectedName - Expected sheet name
   * @param {string} context - Context for error messages
   * @throws {Error} If the sheet is invalid
   */
  static validateSheet(sheet, expectedName = null, context = 'Sheet') {
    if (!sheet) {
      const message = expectedName ? 
        `${context}: Sheet "${expectedName}" not found` :
        `${context}: Sheet not found`;
      
      throw ErrorHandler.createError(
        message,
        ERROR_CODES.SHEET_NOT_FOUND,
        { expectedName }
      );
    }
    
    if (expectedName && sheet.getName() !== expectedName) {
      throw ErrorHandler.createError(
        `${context}: Sheet name mismatch`,
        ERROR_CODES.SHEET_NOT_FOUND,
        { 
          expectedName, 
          actualName: sheet.getName() 
        }
      );
    }
  }
  
  /**
   * Validates operation results for batch processing
   * @param {Array} results - Array of operation results
   * @param {string} context - Context for error messages
   * @throws {Error} If results format is invalid
   */
  static validateBatchResults(results, context = 'Batch results') {
    if (!Array.isArray(results)) {
      throw ErrorHandler.createError(
        `${context}: Results must be an array`,
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    results.forEach((result, index) => {
      if (!result || typeof result !== 'object') {
        throw ErrorHandler.createError(
          `${context}: Result ${index} must be an object`,
          ERROR_CODES.MISSING_PARAMETERS,
          { resultIndex: index }
        );
      }
      
      if (typeof result.success !== 'boolean') {
        throw ErrorHandler.createError(
          `${context}: Result ${index} must have a boolean 'success' property`,
          ERROR_CODES.MISSING_PARAMETERS,
          { resultIndex: index }
        );
      }
    });
  }
}
