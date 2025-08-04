/**
 * Structured logging utility for the NISD API project.
 * Provides consistent logging with different levels and structured output.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Application logger with structured logging capabilities
 */
class AppLogger {
  
  /**
   * Logs an info message
   * @param {string} message - The message to log
   * @param {Object} context - Additional context information
   */
  static info(message, context = {}) {
    this._log(LOG_LEVELS.INFO, message, context);
  }
  
  /**
   * Logs a warning message
   * @param {string} message - The message to log
   * @param {Object} context - Additional context information
   */
  static warn(message, context = {}) {
    this._log(LOG_LEVELS.WARN, message, context);
  }
  
  /**
   * Logs an error message
   * @param {string} message - The message to log
   * @param {Error|Object} error - Error object or additional context
   * @param {Object} context - Additional context information
   */
  static error(message, error = null, context = {}) {
    const errorContext = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...context
    } : { ...error, ...context };
    
    this._log(LOG_LEVELS.ERROR, message, errorContext);
  }
  
  /**
   * Logs a debug message
   * @param {string} message - The message to log
   * @param {Object} context - Additional context information
   */
  static debug(message, context = {}) {
    if (CONFIG.SETTINGS.logLevel === LOG_LEVELS.DEBUG) {
      this._log(LOG_LEVELS.DEBUG, message, context);
    }
  }
  
  /**
   * Logs the start of an operation
   * @param {string} operation - Name of the operation
   * @param {Object} params - Operation parameters
   */
  static operationStart(operation, params = {}) {
    this.info(`Starting operation: ${operation}`, { operation, params });
  }
  
  /**
   * Logs the successful completion of an operation
   * @param {string} operation - Name of the operation
   * @param {Object} result - Operation result
   * @param {number} duration - Operation duration in milliseconds
   */
  static operationSuccess(operation, result = {}, duration = null) {
    const context = { operation, result };
    if (duration !== null) {
      context.duration = `${duration}ms`;
    }
    this.info(`Operation completed successfully: ${operation}`, context);
  }
  
  /**
   * Logs the failure of an operation
   * @param {string} operation - Name of the operation
   * @param {Error} error - The error that occurred
   * @param {Object} params - Operation parameters
   */
  static operationFailure(operation, error, params = {}) {
    this.error(`Operation failed: ${operation}`, error, { operation, params });
  }
  
  /**
   * Logs data processing information
   * @param {string} action - The action being performed
   * @param {number} recordCount - Number of records processed
   * @param {Object} metadata - Additional metadata
   */
  static dataProcessing(action, recordCount, metadata = {}) {
    this.info(`Data processing: ${action}`, {
      action,
      recordCount,
      ...metadata
    });
  }
  
  /**
   * Logs performance metrics
   * @param {string} metric - Name of the metric
   * @param {number} value - Metric value
   * @param {string} unit - Unit of measurement
   * @param {Object} context - Additional context
   */
  static performance(metric, value, unit = 'ms', context = {}) {
    this.info(`Performance metric: ${metric}`, {
      metric,
      value,
      unit,
      ...context
    });
  }
  
  /**
   * Internal logging method
   * @private
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {Object} context - Context information
   */
  static _log(level, message, context = {}) {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context: Object.keys(context).length > 0 ? context : undefined
    };
    
    // Log to console with appropriate method
    const consoleMethod = level === LOG_LEVELS.ERROR ? 'error' : 
                         level === LOG_LEVELS.WARN ? 'warn' : 'log';
    console[consoleMethod](JSON.stringify(logEntry, null, 2));
    
    // Also log to Apps Script Logger for compatibility
    const logMessage = context && Object.keys(context).length > 0 ? 
      `${level}: ${message} | Context: ${JSON.stringify(context)}` : 
      `${level}: ${message}`;
    
    Logger.log(logMessage);
  }
  
  /**
   * Creates a timer for measuring operation duration
   * @param {string} operation - Name of the operation being timed
   * @returns {Object} Timer object with stop method
   */
  static startTimer(operation) {
    const startTime = Date.now();
    
    return {
      stop: () => {
        const duration = Date.now() - startTime;
        this.performance(operation, duration, 'ms');
        return duration;
      }
    };
  }
  
  /**
   * Logs a batch operation summary
   * @param {string} operation - Name of the batch operation
   * @param {Array} results - Array of operation results
   */
  static batchSummary(operation, results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    this.info(`Batch operation completed: ${operation}`, {
      operation,
      total: results.length,
      successful,
      failed,
      successRate: `${((successful / results.length) * 100).toFixed(1)}%`
    });
    
    // Log individual failures
    results.filter(r => !r.success).forEach(result => {
      this.error(`Batch item failed: ${operation}`, result.error, {
        operation,
        item: result.item || 'unknown'
      });
    });
  }
}
