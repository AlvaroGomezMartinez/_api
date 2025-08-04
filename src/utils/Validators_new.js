/**
 * Input validation utilities for the NISD API project.
 * Provides comprehensive validation functions for various data types and formats.
 * Compatible with Google Apps Script V8 runtime.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Validates a Google Spreadsheet ID
 * @param {string} id - The spreadsheet ID to validate
 * @param {string} context - Context for error messages
 * @throws {Error} If the spreadsheet ID is invalid
 */
function Validators_validateSpreadsheetId(id, context) {
  context = context || 'Spreadsheet ID';
  
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw ErrorHandler_createError(
      context + ': Invalid spreadsheet ID provided',
      ERROR_CODES.MISSING_PARAMETERS,
      { provided: id, type: typeof id }
    );
  }
  
  // Basic format validation for Google Spreadsheet IDs
  var idPattern = /^[a-zA-Z0-9_-]{44}$/;
  if (!idPattern.test(id)) {
    AppLogger_warn(context + ': Spreadsheet ID format may be invalid', { id: id });
  }
}

/**
 * Validates a sheet name
 * @param {string} name - The sheet name to validate
 * @param {string} context - Context for error messages
 * @throws {Error} If the sheet name is invalid
 */
function Validators_validateSheetName(name, context) {
  context = context || 'Sheet name';
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw ErrorHandler_createError(
      context + ': Invalid sheet name provided',
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
function Validators_validateEmailConfig(config, context) {
  context = context || 'Email configuration';
  
  if (!config || typeof config !== 'object') {
    throw ErrorHandler_createError(
      context + ': Configuration must be an object',
      ERROR_CODES.MISSING_PARAMETERS,
      { provided: config, type: typeof config }
    );
  }
  
  var required = ['label', 'sheetName', 'rangeToClear'];
  ErrorHandler_validateRequired(config, required, context);
  
  // Validate specific fields
  Validators_validateSheetName(config.sheetName, context + '.sheetName');
  Validators_validateRange(config.rangeToClear, context + '.rangeToClear');
  Validators_validateGmailLabel(config.label, context + '.label');
}

/**
 * Validates a Gmail label name
 * @param {string} label - The Gmail label to validate
 * @param {string} context - Context for error messages
 * @throws {Error} If the label is invalid
 */
function Validators_validateGmailLabel(label, context) {
  context = context || 'Gmail label';
  
  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    throw ErrorHandler_createError(
      context + ': Invalid Gmail label provided',
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
function Validators_validateRange(range, context) {
  context = context || 'Range';
  
  if (!range || typeof range !== 'string' || range.trim().length === 0) {
    throw ErrorHandler_createError(
      context + ': Invalid range provided',
      ERROR_CODES.MISSING_PARAMETERS,
      { provided: range, type: typeof range }
    );
  }
  
  // Basic range format validation (e.g., A1:Z100, A2:O)
  var rangePattern = /^[A-Z]+\d*:[A-Z]+\d*$/;
  if (!rangePattern.test(range)) {
    AppLogger_warn(context + ': Range format may be invalid', { range: range });
  }
}

/**
 * Validates a data array for spreadsheet operations
 * @param {Array} data - The data array to validate
 * @param {string} context - Context for error messages
 * @throws {Error} If the data is invalid
 */
function Validators_validateDataArray(data, context) {
  context = context || 'Data array';
  
  if (!Array.isArray(data)) {
    throw ErrorHandler_createError(
      context + ': Data must be an array',
      ERROR_CODES.MISSING_PARAMETERS,
      { provided: typeof data }
    );
  }
  
  if (data.length === 0) {
    AppLogger_warn(context + ': Data array is empty');
    return;
  }
  
  // Validate that all rows have the same number of columns
  var expectedColumns = data[0].length;
  var inconsistentRows = data.filter(function(row, index) {
    if (!Array.isArray(row)) {
      throw ErrorHandler_createError(
        context + ': Row ' + index + ' is not an array',
        ERROR_CODES.MISSING_PARAMETERS,
        { rowIndex: index, rowType: typeof row }
      );
    }
    return row.length !== expectedColumns;
  });
  
  if (inconsistentRows.length > 0) {
    AppLogger_warn(context + ': Inconsistent row lengths detected', {
      expectedColumns: expectedColumns,
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
function Validators_validatePushDataConfig(config, context) {
  context = context || 'Push data configuration';
  
  if (!config || typeof config !== 'object') {
    throw ErrorHandler_createError(
      context + ': Configuration must be an object',
      ERROR_CODES.MISSING_PARAMETERS
    );
  }
  
  ErrorHandler_validateRequired(config, ['range', 'targets'], context);
  
  Validators_validateRange(config.range, context + '.range');
  
  if (!Array.isArray(config.targets) || config.targets.length === 0) {
    throw ErrorHandler_createError(
      context + ': Targets must be a non-empty array',
      ERROR_CODES.MISSING_PARAMETERS
    );
  }
  
  // Validate each target
  config.targets.forEach(function(target, index) {
    var targetContext = context + '.targets[' + index + ']';
    ErrorHandler_validateRequired(target, ['spreadsheetId', 'sheetName'], targetContext);
    Validators_validateSpreadsheetId(target.spreadsheetId, targetContext + '.spreadsheetId');
    Validators_validateSheetName(target.sheetName, targetContext + '.sheetName');
  });
}

/**
 * Validates an email attachment
 * @param {GoogleAppsScript.Gmail.GmailAttachment} attachment - The attachment to validate
 * @param {string} context - Context for error messages
 * @throws {Error} If the attachment is invalid
 */
function Validators_validateEmailAttachment(attachment, context) {
  context = context || 'Email attachment';
  
  if (!attachment) {
    throw ErrorHandler_createError(
      context + ': No attachment provided',
      ERROR_CODES.ATTACHMENT_NOT_FOUND
    );
  }
  
  // Validate content type
  var contentType = attachment.getContentType();
  if (contentType !== MIME_TYPES.EXCEL) {
    throw ErrorHandler_createError(
      context + ': Invalid attachment type. Expected Excel file.',
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
function Validators_validateSheet(sheet, expectedName, context) {
  expectedName = expectedName || null;
  context = context || 'Sheet';
  
  if (!sheet) {
    var message = expectedName ? 
      context + ': Sheet "' + expectedName + '" not found' :
      context + ': Sheet not found';
    
    throw ErrorHandler_createError(
      message,
      ERROR_CODES.SHEET_NOT_FOUND,
      { expectedName: expectedName }
    );
  }
  
  if (expectedName && sheet.getName() !== expectedName) {
    throw ErrorHandler_createError(
      context + ': Sheet name mismatch',
      ERROR_CODES.SHEET_NOT_FOUND,
      { 
        expectedName: expectedName, 
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
function Validators_validateBatchResults(results, context) {
  context = context || 'Batch results';
  
  if (!Array.isArray(results)) {
    throw ErrorHandler_createError(
      context + ': Results must be an array',
      ERROR_CODES.MISSING_PARAMETERS
    );
  }
  
  results.forEach(function(result, index) {
    if (!result || typeof result !== 'object') {
      throw ErrorHandler_createError(
        context + ': Result ' + index + ' must be an object',
        ERROR_CODES.MISSING_PARAMETERS,
        { resultIndex: index }
      );
    }
    
    if (typeof result.success !== 'boolean') {
      throw ErrorHandler_createError(
        context + ': Result ' + index + ' must have a boolean \'success\' property',
        ERROR_CODES.MISSING_PARAMETERS,
        { resultIndex: index }
      );
    }
  });
}

/**
 * Validators object for backward compatibility and easier access
 */
var Validators = {
  validateSpreadsheetId: Validators_validateSpreadsheetId,
  validateSheetName: Validators_validateSheetName,
  validateEmailConfig: Validators_validateEmailConfig,
  validateGmailLabel: Validators_validateGmailLabel,
  validateRange: Validators_validateRange,
  validateDataArray: Validators_validateDataArray,
  validatePushDataConfig: Validators_validatePushDataConfig,
  validateEmailAttachment: Validators_validateEmailAttachment,
  validateSheet: Validators_validateSheet,
  validateBatchResults: Validators_validateBatchResults
};
