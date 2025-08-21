/**
 * Error Handler Utility for NISD API Project
 * Centralized error handling utility for the NISD API project.
 * Provides consistent error handling, logging, and retry mechanisms.
 * Compatible with Google Apps Script V8 runtime.
 *
 * @file Error handler utilities for NISD API project.
 * @author Alvaro Gomez, Academic Technology Coach
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * Handles errors with consistent logging and formatting.
 * @function ErrorHandler_handle
 * @param {Error} error - The error object to handle.
 * @param {string} [context] - Context information about where the error occurred.
 * @param {Object} [additionalInfo] - Additional information to log.
 * @returns {string} Formatted error message.
 * @example
 * try {
 *   // some operation
 * } catch (error) {
 *   var message = ErrorHandler_handle(error, 'Data processing', { 
 *     operation: 'updateSheet',
 *     sheetName: 'TestSheet' 
 *   });
 * }
 */
function ErrorHandler_handle(error, context, additionalInfo) {
  context = context || '';
  additionalInfo = additionalInfo || {};
  
  var timestamp = new Date().toISOString();
  var errorMessage = '[' + timestamp + '] ' + context + ': ' + error.message;
  
  // Log to both console and Apps Script logger
  console.error(errorMessage, {
    stack: error.stack,
    additionalInfo: additionalInfo,
    context: context
  });
  
  Logger.log('ERROR: ' + errorMessage);
  
  // Log additional info if provided
  if (Object.keys(additionalInfo).length > 0) {
    Logger.log('Additional Info: ' + JSON.stringify(additionalInfo));
  }
  
  return errorMessage;
}

/**
 * Executes an operation with retry logic.
 * @template T
 * @param {function():T} operation - The operation to execute.
 * @param {number} [maxRetries] - Maximum number of retry attempts (default from config).
 * @param {number} [delay] - Delay between retries in milliseconds (default from config).
 * @param {string} [context] - Context for error messages.
 * @returns {T} Result of the operation.
 * @throws {Error} If all retry attempts fail.
 */
function ErrorHandler_withRetry(operation, maxRetries, delay, context) {
  maxRetries = maxRetries !== undefined ? maxRetries : CONFIG.RETRY_CONFIG.maxRetries;
  delay = delay !== undefined ? delay : CONFIG.RETRY_CONFIG.retryDelay;
  context = context || 'Operation';
  
  var attempts = 0;
  var lastError;
  
  while (attempts < maxRetries) {
    attempts++;
    
    try {
      AppLogger_debug(context + ' - Attempt ' + attempts + '/' + maxRetries);
      return operation();
    } catch (error) {
      lastError = error;
      AppLogger_warn(context + ' - Attempt ' + attempts + ' failed: ' + error.message);
      
      if (attempts >= maxRetries) {
        break;
      }
      
      // Wait before retrying
      Utilities.sleep(delay);
    }
  }
  
  // All attempts failed
  var errorMessage = context + ' failed after ' + maxRetries + ' attempts. Last error: ' + lastError.message;
  throw new Error(errorMessage);
}

/**
 * Creates a standardized error object.
 * @param {string} message - Error message.
 * @param {string} [code] - Error code.
 * @param {Object} [details] - Additional error details.
 * @returns {Error} Standardized error object.
 */
function ErrorHandler_createError(message, code, details) {
  code = code || 'GENERAL_ERROR';
  details = details || {};
  
  var error = new Error(message);
  error.code = code;
  error.details = details;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Validates required parameters and throws descriptive errors.
 * @param {Object} params - Parameters to validate.
 * @param {Array<string>} required - Array of required parameter names.
 * @param {string} [context] - Context for error messages.
 * @throws {Error} If any required parameters are missing.
 * @returns {void}
 */
function ErrorHandler_validateRequired(params, required, context) {
  context = context || 'Operation';
  
  var missing = required.filter(function(param) {
    return params[param] === undefined || params[param] === null || params[param] === '';
  });
  
  if (missing.length > 0) {
    throw ErrorHandler_createError(
      context + ': Missing required parameters: ' + missing.join(', '),
      'MISSING_PARAMETERS',
      { missing: missing, provided: Object.keys(params) }
    );
  }
}

/**
 * Error Handler object for backward compatibility and easier access.
 * @namespace ErrorHandler
 */
var ErrorHandler = {
  handle: ErrorHandler_handle,
  withRetry: ErrorHandler_withRetry,
  createError: ErrorHandler_createError,
  validateRequired: ErrorHandler_validateRequired
};

/**
 * Error codes for common error types.
 * @constant
 */
var ERROR_CODES = {
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  SPREADSHEET_NOT_FOUND: 'SPREADSHEET_NOT_FOUND',
  SHEET_NOT_FOUND: 'SHEET_NOT_FOUND',
  EMAIL_NOT_FOUND: 'EMAIL_NOT_FOUND',
  ATTACHMENT_NOT_FOUND: 'ATTACHMENT_NOT_FOUND',
  LABEL_NOT_FOUND: 'LABEL_NOT_FOUND',
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  GENERAL_ERROR: 'GENERAL_ERROR'
};
