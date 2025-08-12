/**
 * @fileoverview NISD API Project - API Reference
 * @description Complete API documentation for all public functions and modules
 * @author Alvaro Gomez, Academic Technology Coach
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * @namespace PublicAPI
 * @description Public functions available for external use
 */

/**
 * @namespace MainFunctions
 * @description Core entry point functions
 * @memberof PublicAPI
 */

/**
 * @function updateSheetsFromEmail
 * @memberof MainFunctions
 * @description Processes all configured email labels and updates spreadsheets
 * @returns {Array<Object>} Array of processing results
 * @example
 * var results = updateSheetsFromEmail();
 */

/**
 * @function pushDataToSheets
 * @memberof MainFunctions  
 * @description Manually pushes data from source to target spreadsheets
 * @returns {void} Shows UI feedback
 * @example
 * pushDataToSheets(); // Called from menu
 */

/**
 * @namespace EmailProcessor
 * @description Email processing and data extraction functions
 * @memberof PublicAPI
 */

/**
 * @function EmailProcessor_processAllConfigs
 * @memberof EmailProcessor
 * @description Processes all email configurations
 * @param {boolean} [dryRun=false] - If true, performs validation without changes
 * @returns {Array<Object>} Processing results for each configuration
 * @example
 * // Normal processing
 * var results = EmailProcessor_processAllConfigs();
 * 
 * // Dry run for testing
 * var testResults = EmailProcessor_processAllConfigs(true);
 */

/**
 * @function EmailProcessor_processSingleConfig
 * @memberof EmailProcessor
 * @description Processes a single email configuration
 * @param {Object} config - Email configuration object
 * @param {boolean} [dryRun=false] - If true, performs validation without changes
 * @returns {Object} Processing result
 * @example
 * var config = {
 *   label: "MyLabel/SubLabel",
 *   sheetName: "MySheet", 
 *   rangeToClear: "A2:Z"
 * };
 * var result = EmailProcessor_processSingleConfig(config);
 */

/**
 * @function EmailProcessor_getProcessingStatus
 * @memberof EmailProcessor
 * @description Gets current email processing status without making changes
 * @returns {Object} Status information for all configurations
 * @example
 * var status = EmailProcessor_getProcessingStatus();
 * console.log('Found ' + status.configurations.length + ' configs');
 */

/**
 * @namespace DataPusher
 * @description Manual data push and synchronization functions
 * @memberof PublicAPI
 */

/**
 * @function DataPusher_pushAllData
 * @memberof DataPusher
 * @description Pushes data from all configured source sheets to targets
 * @returns {Array<Object>} Push results for each source sheet
 * @example
 * var results = DataPusher_pushAllData();
 * var successful = results.filter(r => r.success).length;
 */

/**
 * @function DataPusher_pushSingleSheet
 * @memberof DataPusher
 * @description Pushes data from a single source sheet to its targets
 * @param {string} sheetName - Name of the source sheet
 * @returns {Object} Push result for the specified sheet
 * @example
 * var result = DataPusher_pushSingleSheet('Alt_MS_Attendance_Enrollment_Count');
 * // Note: Many manual data push features are currently disabled (2025-08-12)
 * // See DISABLED_FEATURES.md for re-activation instructions
 */

/**
 * @function DataPusher_getPushDataStatus
 * @memberof DataPusher
 * @description Gets current push data status without making changes
 * @returns {Object} Status information for all source sheets
 * @example
 * var status = DataPusher_getPushDataStatus();
 * status.sourceSheets.forEach(sheet => {
 *   console.log(sheet.sheetName + ': ' + sheet.currentRowCount + ' rows');
 * });
 */

/**
 * @namespace Validators
 * @description Input validation functions
 * @memberof PublicAPI
 */

/**
 * @function Validators_validateSpreadsheetId
 * @memberof Validators
 * @description Validates a Google Spreadsheet ID format
 * @param {string} id - The spreadsheet ID to validate
 * @param {string} [context] - Context for error messages
 * @throws {Error} If the spreadsheet ID is invalid
 * @example
 * try {
 *   Validators_validateSpreadsheetId('1ABC...XYZ');
 * } catch (error) {
 *   console.log('Invalid ID: ' + error.message);
 * }
 */

/**
 * @function Validators_validateEmailConfig
 * @memberof Validators
 * @description Validates an email configuration object
 * @param {Object} config - Email configuration to validate
 * @param {string} [context] - Context for error messages
 * @throws {Error} If the configuration is invalid
 * @example
 * var config = {
 *   label: "Test/Label",
 *   sheetName: "TestSheet",
 *   rangeToClear: "A2:Z"
 * };
 * Validators_validateEmailConfig(config);
 */

/**
 * @namespace Logger
 * @description Logging and performance monitoring functions
 * @memberof PublicAPI
 */

/**
 * @function AppLogger_info
 * @memberof Logger
 * @description Logs an informational message
 * @param {string} message - The message to log
 * @param {Object} [context] - Additional context data
 * @example
 * AppLogger_info('Operation completed', { rowCount: 150 });
 */

/**
 * @function AppLogger_startTimer
 * @memberof Logger
 * @description Starts a performance timer
 * @param {string} operation - Name of the operation being timed
 * @returns {Object} Timer object with stop() method
 * @example
 * var timer = AppLogger_startTimer('dataProcessing');
 * // ... do work ...
 * var duration = timer.stop(); // Returns milliseconds
 */

/**
 * @namespace Utils
 * @description Utility functions
 * @memberof PublicAPI
 */

/**
 * @function Utils_listGmailLabels
 * @memberof Utils
 * @description Lists all Gmail labels for development/debugging
 * @returns {Array<string>} Array of Gmail label names
 * @example
 * var labels = Utils_listGmailLabels();
 * console.log('Found ' + labels.length + ' labels');
 */

/**
 * @function Utils_runSystemTests
 * @memberof Utils
 * @description Runs comprehensive system tests
 * @returns {Object} Test results with overall status
 * @example
 * var results = Utils_runSystemTests();
 * if (results.overall === 'PASS') {
 *   console.log('All tests passed!');
 * }
 */

/**
 * @namespace TestFunctions
 * @description Testing and validation functions
 * @memberof PublicAPI
 */

/**
 * @function runAllTests
 * @memberof TestFunctions
 * @description Runs all available tests
 * @returns {Object} Comprehensive test results
 * @example
 * var results = runAllTests();
 * console.log(results.summary.passed + ' of ' + results.summary.total + ' tests passed');
 */

/**
 * @function testValidators
 * @memberof TestFunctions
 * @description Tests validator functions
 * @returns {Object} Validator test results
 */

/**
 * @function testLogger
 * @memberof TestFunctions
 * @description Tests logging functionality
 * @returns {Object} Logger test results
 */

/**
 * @namespace MenuFunctions
 * @description UI menu functions
 * @memberof PublicAPI
 */

/**
 * @function showPushDataStatus
 * @memberof MenuFunctions
 * @description Shows push data status in a dialog
 * @example
 * showPushDataStatus(); // Called from menu
 */

/**
 * @function showEmailProcessingStatus
 * @memberof MenuFunctions
 * @description Shows email processing status in a dialog
 * @example
 * showEmailProcessingStatus(); // Called from menu
 */

/**
 * @function showSystemTestResults
 * @memberof MenuFunctions
 * @description Shows system test results in a dialog
 * @example
 * showSystemTestResults(); // Called from menu
 */

/**
 * @namespace DataTypes
 * @description Common data type definitions
 */

/**
 * @typedef {Object} EmailConfig
 * @memberof DataTypes
 * @property {string} label - Gmail label to search
 * @property {string} sheetName - Target sheet name
 * @property {string} rangeToClear - Range to clear before updating
 * @example
 * var config = {
 *   label: "Reports/Daily",
 *   sheetName: "DailyData", 
 *   rangeToClear: "A2:J"
 * };
 */

/**
 * @typedef {Object} PushDataConfig
 * @memberof DataTypes
 * @property {string} range - Source range to read
 * @property {Array<Object>} targets - Target spreadsheet configurations
 * @property {string} targets[].spreadsheetId - Target spreadsheet ID
 * @property {string} targets[].sheetName - Target sheet name
 * @example
 * var config = {
 *   range: "A2:H",
 *   targets: [{
 *     spreadsheetId: "1ABC...XYZ",
 *     sheetName: "TargetSheet"
 *   }]
 * };
 */

/**
 * @typedef {Object} ProcessingResult
 * @memberof DataTypes
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} sheetName - Name of the processed sheet
 * @property {number} [dataCount] - Number of rows processed
 * @property {string} [error] - Error message if operation failed
 * @property {number} [duration] - Operation duration in milliseconds
 * @example
 * var result = {
 *   success: true,
 *   sheetName: "TestSheet",
 *   dataCount: 50,
 *   duration: 1200
 * };
 */
