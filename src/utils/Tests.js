/**
 * Test suite for the NISD API project.
 * Provides comprehensive testing functions for all modules.
 * Compatible with Google Apps Script V8 runtime.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Main test runner function
 * Runs all available tests and provides a summary
 */
function runAllTests() {
  try {
    AppLogger_operationStart('runAllTests');
    
    var testResults = {
      timestamp: DateUtils_getCurrentTimestamp(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    // Configuration tests
    testResults.tests.configValidation = testConfigValidation();
    
    // Service tests (these are safe to run)
    testResults.tests.validators = testValidators();
    testResults.tests.dateUtils = testDateUtils();
    testResults.tests.errorHandler = testErrorHandler();
    testResults.tests.logger = testLogger();
    
    // System connectivity tests (read-only)
    testResults.tests.gmailConnectivity = testGmailConnectivity();
    testResults.tests.spreadsheetConnectivity = testSpreadsheetConnectivity();
    
    // Calculate summary
    for (var testName in testResults.tests) {
      if (testResults.tests.hasOwnProperty(testName)) {
        var test = testResults.tests[testName];
        testResults.summary.total++;
        if (test.status === 'PASS') {
          testResults.summary.passed++;
        } else if (test.status === 'FAIL') {
          testResults.summary.failed++;
        } else {
          testResults.summary.skipped++;
        }
      }
    }
    
    var allPassed = testResults.summary.failed === 0;
    
    AppLogger_operationSuccess('runAllTests', {
      allPassed: allPassed,
      summary: testResults.summary
    });
    
    return testResults;
    
  } catch (error) {
    AppLogger_operationFailure('runAllTests', error);
    throw error;
  }
}

/**
 * Tests configuration validation
 */
function testConfigValidation() {
  try {
    var results = [];
    
    // Test that CONFIG object exists and has required properties
    if (!CONFIG) {
      return { status: 'FAIL', error: 'CONFIG object not found' };
    }
    
    // Test required CONFIG properties
    var requiredProps = ['SPREADSHEETS', 'EMAIL_CONFIGS', 'PUSH_DATA_CONFIGS', 'SETTINGS'];
    for (var i = 0; i < requiredProps.length; i++) {
      var prop = requiredProps[i];
      if (!CONFIG[prop]) {
        results.push('Missing CONFIG.' + prop);
      }
    }
    
    // Test EMAIL_CONFIGS structure
    if (CONFIG.EMAIL_CONFIGS && Array.isArray(CONFIG.EMAIL_CONFIGS)) {
      CONFIG.EMAIL_CONFIGS.forEach(function(config, index) {
        try {
          Validators_validateEmailConfig(config, 'EMAIL_CONFIGS[' + index + ']');
        } catch (error) {
          results.push('Invalid EMAIL_CONFIGS[' + index + ']: ' + error.message);
        }
      });
    }
    
    // Test PUSH_DATA_CONFIGS structure
    if (CONFIG.PUSH_DATA_CONFIGS && CONFIG.PUSH_DATA_CONFIGS.sourceSheets) {
      for (var sheetName in CONFIG.PUSH_DATA_CONFIGS.sourceSheets) {
        if (CONFIG.PUSH_DATA_CONFIGS.sourceSheets.hasOwnProperty(sheetName)) {
          var config = CONFIG.PUSH_DATA_CONFIGS.sourceSheets[sheetName];
          try {
            Validators_validatePushDataConfig(config, 'PUSH_DATA_CONFIGS.' + sheetName);
          } catch (error) {
            results.push('Invalid PUSH_DATA_CONFIGS.' + sheetName + ': ' + error.message);
          }
        }
      }
    }
    
    return results.length === 0 ? 
      { status: 'PASS', message: 'All configurations valid' } :
      { status: 'FAIL', errors: results };
      
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests the Validators utility class
 */
function testValidators() {
  try {
    var tests = [];
    
    // Test spreadsheet ID validation
    try {
      Validators_validateSpreadsheetId(CONFIG.SPREADSHEETS.MAIN);
      tests.push({ name: 'valid spreadsheet ID', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid spreadsheet ID', result: 'FAIL', error: error.message });
    }
    
    // Test invalid spreadsheet ID
    try {
      Validators_validateSpreadsheetId('invalid');
      tests.push({ name: 'invalid spreadsheet ID rejection', result: 'FAIL', error: 'Should have thrown error' });
    } catch (error) {
      tests.push({ name: 'invalid spreadsheet ID rejection', result: 'PASS' });
    }
    
    // Test sheet name validation
    try {
      Validators_validateSheetName('TestSheet');
      tests.push({ name: 'valid sheet name', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid sheet name', result: 'FAIL', error: error.message });
    }
    
    // Test range validation
    try {
      Validators_validateRange('A1:Z100');
      tests.push({ name: 'valid range', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid range', result: 'FAIL', error: error.message });
    }
    
    // Test Gmail label validation
    try {
      Validators_validateGmailLabel('Test/Label');
      tests.push({ name: 'valid Gmail label', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid Gmail label', result: 'FAIL', error: error.message });
    }
    
    var failed = tests.filter(function(t) { return t.result === 'FAIL'; });
    
    return {
      status: failed.length === 0 ? 'PASS' : 'FAIL',
      tests: tests,
      summary: tests.length + ' tests, ' + failed.length + ' failed'
    };
    
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests DateUtils functionality
 */
function testDateUtils() {
  try {
    var tests = [];
    
    // Test date formatting
    try {
      var formatted = DateUtils_formatDate(new Date('2025-01-01'));
      if (formatted && typeof formatted === 'string' && formatted.length > 0) {
        tests.push({ name: 'date formatting', result: 'PASS' });
      } else {
        tests.push({ name: 'date formatting', result: 'FAIL', error: 'Invalid format result' });
      }
    } catch (error) {
      tests.push({ name: 'date formatting', result: 'FAIL', error: error.message });
    }
    
    // Test timestamp creation
    try {
      var timestamp = DateUtils_getCurrentTimestamp();
      if (timestamp && typeof timestamp === 'string' && timestamp.includes('T')) {
        tests.push({ name: 'timestamp creation', result: 'PASS' });
      } else {
        tests.push({ name: 'timestamp creation', result: 'FAIL', error: 'Invalid timestamp' });
      }
    } catch (error) {
      tests.push({ name: 'timestamp creation', result: 'FAIL', error: error.message });
    }
    
    // Test timestamp note creation
    try {
      var note = DateUtils_createTimestampNote('Test');
      if (note && typeof note === 'string' && note.includes('Test') && note.includes(':')) {
        tests.push({ name: 'timestamp note creation', result: 'PASS' });
      } else {
        tests.push({ name: 'timestamp note creation', result: 'FAIL', error: 'Invalid note format' });
      }
    } catch (error) {
      tests.push({ name: 'timestamp note creation', result: 'FAIL', error: error.message });
    }
    
    var failed = tests.filter(function(t) { return t.result === 'FAIL'; });
    
    return {
      status: failed.length === 0 ? 'PASS' : 'FAIL',
      tests: tests,
      summary: tests.length + ' tests, ' + failed.length + ' failed'
    };
    
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests ErrorHandler functionality
 */
function testErrorHandler() {
  try {
    var tests = [];
    
    // Test error creation
    try {
      var error = ErrorHandler_createError('Test error', 'TEST_CODE', { test: true });
      if (error && error.message === 'Test error' && error.code === 'TEST_CODE') {
        tests.push({ name: 'error creation', result: 'PASS' });
      } else {
        tests.push({ name: 'error creation', result: 'FAIL', error: 'Invalid error object' });
      }
    } catch (error) {
      tests.push({ name: 'error creation', result: 'FAIL', error: error.message });
    }
    
    // Test required field validation
    try {
      ErrorHandler_validateRequired({ name: 'test' }, ['name'], 'Test object');
      tests.push({ name: 'required field validation', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'required field validation', result: 'FAIL', error: error.message });
    }
    
    // Test missing required field
    try {
      ErrorHandler_validateRequired({}, ['name'], 'Test object');
      tests.push({ name: 'missing required field detection', result: 'FAIL', error: 'Should have thrown error' });
    } catch (error) {
      tests.push({ name: 'missing required field detection', result: 'PASS' });
    }
    
    var failed = tests.filter(function(t) { return t.result === 'FAIL'; });
    
    return {
      status: failed.length === 0 ? 'PASS' : 'FAIL',
      tests: tests,
      summary: tests.length + ' tests, ' + failed.length + ' failed'
    };
    
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests Logger functionality
 */
function testLogger() {
  try {
    var tests = [];
    
    // Test info logging
    try {
      AppLogger_info('Test info message', { test: true });
      tests.push({ name: 'info logging', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'info logging', result: 'FAIL', error: error.message });
    }
    
    // Test warning logging
    try {
      AppLogger_warn('Test warn message');
      tests.push({ name: 'warning logging', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'warning logging', result: 'FAIL', error: error.message });
    }
    
    // Test timer functionality
    try {
      var timer = AppLogger_startTimer('test operation');
      var duration = timer.stop();
      if (timer && typeof timer.stop === 'function' && typeof duration === 'number') {
        tests.push({ name: 'timer functionality', result: 'PASS' });
      } else {
        tests.push({ name: 'timer functionality', result: 'FAIL', error: 'Invalid timer result' });
      }
    } catch (error) {
      tests.push({ name: 'timer functionality', result: 'FAIL', error: error.message });
    }
    
    var failed = tests.filter(function(t) { return t.result === 'FAIL'; });
    
    return {
      status: failed.length === 0 ? 'PASS' : 'FAIL',
      tests: tests,
      summary: tests.length + ' tests, ' + failed.length + ' failed'
    };
    
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests Gmail connectivity (read-only test)
 */
function testGmailConnectivity() {
  try {
    var labels = Utils_listGmailLabels();
    
    if (Array.isArray(labels) && labels.length > 0) {
      // Check if configured labels exist
      var configuredLabels = CONFIG.EMAIL_CONFIGS.map(function(c) { return c.label; });
      var missingLabels = configuredLabels.filter(function(label) {
        return labels.indexOf(label) === -1;
      });
      
      return {
        status: missingLabels.length === 0 ? 'PASS' : 'WARN',
        labelCount: labels.length,
        missingLabels: missingLabels,
        message: missingLabels.length === 0 ? 
          'All configured labels found' : 
          'Some configured labels missing: ' + missingLabels.join(', ')
      };
    } else {
      return { status: 'FAIL', error: 'No Gmail labels found or Gmail not accessible' };
    }
    
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests spreadsheet connectivity (read-only test)
 */
function testSpreadsheetConnectivity() {
  try {
    // Test main spreadsheet access
    var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEETS.MAIN);
    
    if (!spreadsheet) {
      return { status: 'FAIL', error: 'Cannot access main spreadsheet' };
    }
    
    var sheets = spreadsheet.getSheets();
    
    return {
      status: 'PASS',
      spreadsheetId: CONFIG.SPREADSHEETS.MAIN,
      sheetCount: sheets.length,
      message: 'Main spreadsheet accessible with ' + sheets.length + ' sheets'
    };
    
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Utility function to run system tests (used by Menu functions)
 * @returns {Object} Test results object
 */
function Utils_runSystemTests() {
  try {
    AppLogger_operationStart('runSystemTests');
    
    var results = runAllTests();
    
    AppLogger_operationSuccess('runSystemTests', {
      overall: results.summary.failed === 0 ? 'PASS' : 'FAIL',
      summary: results.summary
    });
    
    return {
      overall: results.summary.failed === 0 ? 'PASS' : 'FAIL',
      tests: results.tests,
      summary: results.summary
    };
    
  } catch (error) {
    AppLogger_operationFailure('runSystemTests', error);
    return {
      overall: 'ERROR',
      error: error.message,
      tests: {},
      summary: { total: 0, passed: 0, failed: 1, skipped: 0 }
    };
  }
}
