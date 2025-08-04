/**
 * @fileoverview NISD API Project - Complete Documentation
 * @description Automated data processing system for NISD using Google Apps Script
 * @author Alvaro Gomez, Academic Technology Coach
 * @contact alvaro.gomez@nisd.net
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * @namespace NISD_API
 * @description The NISD API project provides automated data processing capabilities
 * for educational workflows, including email processing and spreadsheet management.
 */

/**
 * @overview Project Structure
 * 
 * The NISD API project follows a modular architecture:
 * 
 * ## Root Files
 * - `Code.js` - Main entry point with core functions
 * - `Menu.js` - Google Sheets UI menu integration
 * - `Get Labels.js` - Gmail label utility functions
 * 
 * ## Source Code Structure
 * - `src/config/` - Configuration management
 * - `src/main/` - Core business logic processors
 * - `src/services/` - External service integrations
 * - `src/utils/` - Utility functions and helpers
 * 
 * ## Key Features
 * - **Email Processing**: Automated Gmail attachment processing
 * - **Data Push**: Manual spreadsheet data synchronization
 * - **Validation**: Comprehensive input validation
 * - **Logging**: Structured logging and performance monitoring
 * - **Error Handling**: Robust error management with retry logic
 */

/**
 * @overview Configuration Management
 * 
 * All project settings are centralized in `src/config/Config.js`:
 * 
 * ## Main Configuration Objects
 * - `CONFIG.SPREADSHEETS` - Spreadsheet ID mappings
 * - `CONFIG.EMAIL_CONFIGS` - Email processing configurations
 * - `CONFIG.PUSH_DATA_CONFIGS` - Manual data push settings
 * - `CONFIG.RETRY_CONFIG` - Retry and timeout settings
 * - `CONFIG.SETTINGS` - Application-wide settings
 * 
 * ## Constants
 * - `MIME_TYPES` - File type constants
 * - `RANGES` - Common spreadsheet range patterns
 * - `LOG_LEVELS` - Logging level definitions
 * - `ERROR_CODES` - Error classification codes
 */

/**
 * @overview Main Processors
 * 
 * ## EmailProcessor (`src/main/EmailProcessor.js`)
 * Handles automated email processing workflows:
 * - Retrieves emails from configured Gmail labels
 * - Processes Excel attachments
 * - Updates target spreadsheets with extracted data
 * - Supports dry-run mode for testing
 * 
 * ## DataPusher (`src/main/DataPusher.js`)
 * Manages manual data synchronization:
 * - Reads data from source spreadsheet sheets
 * - Validates configurations and permissions
 * - Pushes data to multiple target spreadsheets
 * - Provides detailed operation feedback
 */

/**
 * @overview Service Layer
 * 
 * ## EmailService (`src/services/EmailService.js`)
 * Gmail integration and email processing:
 * - Gmail label management
 * - Email retrieval and filtering
 * - Attachment extraction and validation
 * - Excel file processing
 * 
 * ## SheetService (`src/services/SheetService.js`)
 * Google Sheets operations:
 * - Spreadsheet metadata retrieval
 * - Sheet data reading and writing
 * - Range operations and validation
 * - Bulk data operations
 * 
 * ## DriveService (`src/services/DriveService.js`)
 * Google Drive file operations:
 * - Temporary file management
 * - Excel to Sheets conversion
 * - File validation and cleanup
 * - Metadata extraction
 */

/**
 * @overview Utility Layer
 * 
 * ## Logging (`src/utils/Logger.js`)
 * Structured logging system:
 * - JSON-formatted log entries
 * - Performance timing
 * - Multiple log levels (ERROR, WARN, INFO, DEBUG)
 * - Operation tracking
 * 
 * ## Validation (`src/utils/Validators.js`)
 * Input validation framework:
 * - Spreadsheet ID validation
 * - Configuration validation
 * - Data format validation
 * - Email attachment validation
 * 
 * ## Error Handling (`src/utils/ErrorHandler.js`)
 * Centralized error management:
 * - Custom error creation
 * - Error code classification
 * - Retry logic implementation
 * - Required field validation
 * 
 * ## Date Utilities (`src/utils/DateUtils.js`)
 * Date and time operations:
 * - Timezone-aware formatting
 * - Timestamp generation
 * - Date validation
 * - Note creation with timestamps
 * 
 * ## Testing (`src/utils/Tests.js`)
 * Comprehensive test suite:
 * - Unit tests for all modules
 * - Integration tests
 * - System connectivity tests
 * - Configuration validation tests
 */

/**
 * @overview Usage Examples
 * 
 * ## Running Email Processing
 * ```javascript
 * // Process all configured email labels
 * processEmailData();
 * 
 * // Dry run mode (no data changes)
 * var results = EmailProcessor_processAllConfigs(true);
 * ```
 * 
 * ## Manual Data Push
 * ```javascript
 * // Push data from all configured source sheets
 * pushDataToSheets();
 * 
 * // Get push status without executing
 * var status = DataPusher_getPushDataStatus();
 * ```
 * 
 * ## System Testing
 * ```javascript
 * // Run all available tests
 * var results = runAllTests();
 * 
 * // Test specific components
 * var validatorTests = testValidators();
 * var loggerTests = testLogger();
 * ```
 * 
 * ## Utility Functions
 * ```javascript
 * // List Gmail labels
 * var labels = Utils_listGmailLabels();
 * 
 * // Get system information
 * var info = Utils_getSystemInfo();
 * 
 * // Validate spreadsheet ID
 * Validators_validateSpreadsheetId(spreadsheetId);
 * ```
 */

/**
 * @overview Google Apps Script Compatibility
 * 
 * This project is fully compatible with Google Apps Script V8 runtime:
 * - Uses traditional JavaScript syntax (var, function declarations)
 * - Avoids ES6+ features not supported in GAS
 * - Function-based architecture instead of classes
 * - Compatible with GAS execution model and quotas
 * 
 * ## Performance Considerations
 * - Implements retry logic for transient failures
 * - Uses batch operations where possible
 * - Includes performance timing and monitoring
 * - Optimized for GAS execution limits
 * 
 * ## Security Features
 * - Input validation for all external data
 * - Secure spreadsheet access patterns
 * - Error messages don't expose sensitive information
 * - Proper cleanup of temporary files
 */

/**
 * @todo Future Enhancements
 * - Add support for additional file formats (CSV, JSON)
 * - Implement webhook integrations
 * - Add data transformation pipelines
 * - Enhance reporting and analytics
 * - Add user role management
 * - Implement data archiving strategies
 */
