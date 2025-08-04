/**
 * Centralized error handling utility for the NISD API project.
 * Provides consistent error handling, logging, and retry mechanisms.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Error handling utility class
 */
class ErrorHandler {
  
  /**
   * Handles errors with consistent logging and formatting
   * @param {Error} error - The error object to handle
   * @param {string} context - Context information about where the error occurred
   * @param {Object} additionalInfo - Additional information to log
   * @returns {string} Formatted error message
   */
  static handle(error, context = '', additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ${context}: ${error.message}`;
    
    // Log to both console and Apps Script logger
    console.error(errorMessage, {
      stack: error.stack,
      additionalInfo,
      context
    });
    
    Logger.log(`ERROR: ${errorMessage}`);
    
    // Log additional info if provided
    if (Object.keys(additionalInfo).length > 0) {
      Logger.log(`Additional Info: ${JSON.stringify(additionalInfo)}`);
    }
    
    return errorMessage;
  }
  
  /**
   * Executes an operation with retry logic
   * @param {Function} operation - The operation to execute
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} delay - Delay between retries in milliseconds
   * @param {string} context - Context for error messages
   * @returns {*} Result of the operation
   * @throws {Error} If all retry attempts fail
   */
  static withRetry(operation, maxRetries = CONFIG.RETRY_CONFIG.maxRetries, delay = CONFIG.RETRY_CONFIG.retryDelay, context = 'Operation') {
    let attempts = 0;
    let lastError;
    
    while (attempts < maxRetries) {
      attempts++;
      
      try {
        AppLogger.debug(`${context} - Attempt ${attempts}/${maxRetries}`);
        return operation();
      } catch (error) {
        lastError = error;
        AppLogger.warn(`${context} - Attempt ${attempts} failed: ${error.message}`);
        
        if (attempts >= maxRetries) {
          break;
        }
        
        // Wait before retrying
        Utilities.sleep(delay);
      }
    }
    
    // All attempts failed
    const errorMessage = `${context} failed after ${maxRetries} attempts. Last error: ${lastError.message}`;
    throw new Error(errorMessage);
  }
  
  /**
   * Executes an async operation with retry logic
   * @param {Function} operation - The async operation to execute
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} delay - Delay between retries in milliseconds
   * @param {string} context - Context for error messages
   * @returns {Promise<*>} Result of the operation
   */
  static async withRetryAsync(operation, maxRetries = CONFIG.RETRY_CONFIG.maxRetries, delay = CONFIG.RETRY_CONFIG.retryDelay, context = 'Async Operation') {
    let attempts = 0;
    let lastError;
    
    while (attempts < maxRetries) {
      attempts++;
      
      try {
        AppLogger.debug(`${context} - Attempt ${attempts}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error;
        AppLogger.warn(`${context} - Attempt ${attempts} failed: ${error.message}`);
        
        if (attempts >= maxRetries) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All attempts failed
    const errorMessage = `${context} failed after ${maxRetries} attempts. Last error: ${lastError.message}`;
    throw new Error(errorMessage);
  }
  
  /**
   * Creates a standardized error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Error} Standardized error object
   */
  static createError(message, code = 'GENERAL_ERROR', details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    error.timestamp = new Date().toISOString();
    return error;
  }
  
  /**
   * Validates required parameters and throws descriptive errors
   * @param {Object} params - Parameters to validate
   * @param {Array<string>} required - Array of required parameter names
   * @param {string} context - Context for error messages
   * @throws {Error} If any required parameters are missing
   */
  static validateRequired(params, required, context = 'Operation') {
    const missing = required.filter(param => 
      params[param] === undefined || params[param] === null || params[param] === ''
    );
    
    if (missing.length > 0) {
      throw this.createError(
        `${context}: Missing required parameters: ${missing.join(', ')}`,
        'MISSING_PARAMETERS',
        { missing, provided: Object.keys(params) }
      );
    }
  }
}

/**
 * Error codes for common error types
 */
const ERROR_CODES = {
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
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
