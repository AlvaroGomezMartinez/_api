/**
 * @file Logger Utility for NISD API Project
 * @description Structured logging utility for the NISD API project.
 * Provides consistent logging with different levels and structured output.
 * Compatible with Google Apps Script V8 runtime.
 * @author Alvaro Gomez, Academic Technology Coach
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * @typedef {Object} LoggerContext
 * @property {string} [operation] - Name of the operation.
 * @property {Object} [params] - Operation parameters.
 * @property {Object} [result] - Operation result.
 * @property {number|string} [duration] - Duration in ms or as string.
 * @property {string} [metric] - Metric name.
 * @property {number} [value] - Metric value.
 * @property {string} [unit] - Unit of measurement.
 * @property {number} [recordCount] - Number of records processed.
 * @property {Object} [metadata] - Additional metadata.
 */

/**
 * @typedef {Object} BatchResult
 * @property {boolean} success - Whether the operation was successful.
 * @property {Object} [error] - Error object if failed.
 * @property {any} [item] - The item processed.
 */

/**
 * Logs an info message.
 * @function AppLogger_info
 * @param {string} message - The message to log.
 * @param {LoggerContext} [context] - Additional context information.
 * @returns {void}
 * @example
 * AppLogger_info('Operation completed successfully');
 * AppLogger_info('Data processed', { rowCount: 150, duration: 1200 });
 */
function AppLogger_info(message, context) {
  context = context || {};
  AppLogger_log(LOG_LEVELS.INFO, message, context);
}

/**
 * Logs a warning message.
 * @function AppLogger_warn
 * @param {string} message - The message to log.
 * @param {LoggerContext} [context] - Additional context information.
 * @returns {void}
 * @example
 * AppLogger_warn('Missing optional parameter', { parameter: 'context' });
 */
function AppLogger_warn(message, context) {
  context = context || {};
  AppLogger_log(LOG_LEVELS.WARN, message, context);
}

/**
 * Logs an error message.
 * @function AppLogger_error
 * @param {string} message - The message to log.
 * @param {Error|Object} [error] - Error object or additional context.
 * @param {LoggerContext} [context] - Additional context information.
 * @returns {void}
 * @example
 * try {
 *   // some operation
 * } catch (error) {
 *   AppLogger_error('Operation failed', error, { operation: 'dataProcessing' });
 * }
 */
function AppLogger_error(message, error, context) {
  error = error || null;
  context = context || {};
  
  var errorContext = {};
  if (error instanceof Error) {
    errorContext = {
      message: error.message,
      stack: error.stack,
      code: error.code
    };
    // Merge with provided context
    for (var key in context) {
      if (context.hasOwnProperty(key)) {
        errorContext[key] = context[key];
      }
    }
  } else if (error && typeof error === 'object') {
    errorContext = error;
    // Merge with provided context
    for (var key in context) {
      if (context.hasOwnProperty(key)) {
        errorContext[key] = context[key];
      }
    }
  } else {
    errorContext = context;
  }
  
  AppLogger_log(LOG_LEVELS.ERROR, message, errorContext);
}

/**
 * Logs a debug message.
 * @param {string} message - The message to log.
 * @param {LoggerContext} [context] - Additional context information.
 * @returns {void}
 */
function AppLogger_debug(message, context) {
  context = context || {};
  if (CONFIG.SETTINGS.logLevel === LOG_LEVELS.DEBUG) {
    AppLogger_log(LOG_LEVELS.DEBUG, message, context);
  }
}

/**
 * Logs the start of an operation.
 * @param {string} operation - Name of the operation.
 * @param {Object} [params] - Operation parameters.
 * @returns {void}
 */
function AppLogger_operationStart(operation, params) {
  params = params || {};
  AppLogger_info('Starting operation: ' + operation, { operation: operation, params: params });
}

/**
 * Logs the successful completion of an operation.
 * @param {string} operation - Name of the operation.
 * @param {Object} [result] - Operation result.
 * @param {number} [duration] - Operation duration in milliseconds.
 * @returns {void}
 */
function AppLogger_operationSuccess(operation, result, duration) {
  result = result || {};
  var context = { operation: operation, result: result };
  if (duration !== null && duration !== undefined) {
    context.duration = duration + 'ms';
  }
  AppLogger_info('Operation completed successfully: ' + operation, context);
}

/**
 * Logs the failure of an operation.
 * @param {string} operation - Name of the operation.
 * @param {Error} error - The error that occurred.
 * @param {Object} [params] - Operation parameters.
 * @returns {void}
 */
function AppLogger_operationFailure(operation, error, params) {
  params = params || {};
  AppLogger_error('Operation failed: ' + operation, error, { operation: operation, params: params });
}

/**
 * Logs data processing information.
 * @param {string} action - The action being performed.
 * @param {number} recordCount - Number of records processed.
 * @param {Object} [metadata] - Additional metadata.
 * @returns {void}
 */
function AppLogger_dataProcessing(action, recordCount, metadata) {
  metadata = metadata || {};
  var context = {
    action: action,
    recordCount: recordCount
  };
  for (var key in metadata) {
    if (metadata.hasOwnProperty(key)) {
      context[key] = metadata[key];
    }
  }
  AppLogger_info('Data processing: ' + action, context);
}

/**
 * Logs performance metrics.
 * @param {string} metric - Name of the metric.
 * @param {number} value - Metric value.
 * @param {string} [unit='ms'] - Unit of measurement.
 * @param {LoggerContext} [context] - Additional context.
 * @returns {void}
 */
function AppLogger_performance(metric, value, unit, context) {
  unit = unit || 'ms';
  context = context || {};
  var logContext = {
    metric: metric,
    value: value,
    unit: unit
  };
  for (var key in context) {
    if (context.hasOwnProperty(key)) {
      logContext[key] = context[key];
    }
  }
  AppLogger_info('Performance metric: ' + metric, logContext);
}

/**
 * Internal logging method.
 * @param {string} level - Log level.
 * @param {string} message - Message to log.
 * @param {LoggerContext} [context] - Context information.
 * @returns {void}
 */
function AppLogger_log(level, message, context) {
  context = context || {};
  var logEntry = {
    level: level,
    timestamp: new Date().toISOString(),
    message: message
  };
  
  if (Object.keys(context).length > 0) {
    logEntry.context = context;
  }
  
  // Log to console with appropriate method
  var consoleMethod = level === LOG_LEVELS.ERROR ? 'error' : 
                     level === LOG_LEVELS.WARN ? 'warn' : 'log';
  console[consoleMethod](JSON.stringify(logEntry, null, 2));
  
  // Also log to Apps Script Logger for compatibility
  var logMessage = Object.keys(context).length > 0 ? 
    level + ': ' + message + ' | Context: ' + JSON.stringify(context) : 
    level + ': ' + message;
  
  Logger.log(logMessage);
}

/**
 * Creates a timer for measuring operation duration.
 * @param {string} operation - Name of the operation being timed.
 * @returns {{stop: function(): number}} Timer object with stop method returning duration in ms.
 */
function AppLogger_startTimer(operation) {
  var startTime = Date.now();
  
  return {
    stop: function() {
      var duration = Date.now() - startTime;
      AppLogger_performance(operation, duration, 'ms');
      return duration;
    }
  };
}

/**
 * Logs a batch operation summary.
 * @param {string} operation - Name of the batch operation.
 * @param {BatchResult[]} results - Array of operation results.
 * @returns {void}
 */
function AppLogger_batchSummary(operation, results) {
  var successful = 0;
  for (var i = 0; i < results.length; i++) {
    if (results[i].success) {
      successful++;
    }
  }
  var failed = results.length - successful;
  
  AppLogger_info('Batch operation completed: ' + operation, {
    operation: operation,
    total: results.length,
    successful: successful,
    failed: failed,
    successRate: ((successful / results.length) * 100).toFixed(1) + '%'
  });
  
  // Log individual failures
  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    if (!result.success) {
      AppLogger_error('Batch item failed: ' + operation, result.error, {
        operation: operation,
        item: result.item || 'unknown'
      });
    }
  }
}

/**
 * AppLogger object for backward compatibility and easier access.
 * @namespace AppLogger
 */
var AppLogger = {
  info: AppLogger_info,
  warn: AppLogger_warn,
  error: AppLogger_error,
  debug: AppLogger_debug,
  operationStart: AppLogger_operationStart,
  operationSuccess: AppLogger_operationSuccess,
  operationFailure: AppLogger_operationFailure,
  dataProcessing: AppLogger_dataProcessing,
  performance: AppLogger_performance,
  startTimer: AppLogger_startTimer,
  batchSummary: AppLogger_batchSummary
};
