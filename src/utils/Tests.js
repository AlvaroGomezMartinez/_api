/**
 * Test functions for the NISD API project.
 * Provides test cases to validate the refactored functionality.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Main test runner function
 * Runs all available tests and provides a summary
 */
function runAllTests() {
  try {
    AppLogger.operationStart('runAllTests');
    
    const testResults = {
      timestamp: DateUtils.getCurrentTimestamp(),
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
    Object.values(testResults.tests).forEach(test => {
      testResults.summary.total++;
      if (test.status === 'PASS') {
        testResults.summary.passed++;
      } else if (test.status === 'FAIL') {
        testResults.summary.failed++;
      } else {
        testResults.summary.skipped++;
      }
    });
    
    const allPassed = testResults.summary.failed === 0;
    
    AppLogger.operationSuccess('runAllTests', {
      allPassed,
      summary: testResults.summary
    });
    
    return testResults;
    
  } catch (error) {
    AppLogger.operationFailure('runAllTests', error);
    throw error;
  }
}

/**
 * Tests configuration validation
 */
function testConfigValidation() {
  try {
    const results = [];
    
    // Test that CONFIG object exists and has required properties
    if (!CONFIG) {
      return { status: 'FAIL', error: 'CONFIG object not found' };
    }
    
    // Test required CONFIG properties
    const requiredProps = ['SPREADSHEETS', 'EMAIL_CONFIGS', 'PUSH_DATA_CONFIGS', 'SETTINGS'];
    for (const prop of requiredProps) {
      if (!CONFIG[prop]) {
        results.push(`Missing CONFIG.${prop}`);
      }
    }
    
    // Test EMAIL_CONFIGS structure
    if (CONFIG.EMAIL_CONFIGS && Array.isArray(CONFIG.EMAIL_CONFIGS)) {
      CONFIG.EMAIL_CONFIGS.forEach((config, index) => {
        try {
          Validators.validateEmailConfig(config, `EMAIL_CONFIGS[${index}]`);
        } catch (error) {
          results.push(`Invalid EMAIL_CONFIGS[${index}]: ${error.message}`);
        }
      });
    }
    
    // Test PUSH_DATA_CONFIGS structure
    if (CONFIG.PUSH_DATA_CONFIGS && CONFIG.PUSH_DATA_CONFIGS.sourceSheets) {
      Object.entries(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).forEach(([sheetName, config]) => {
        try {
          Validators.validatePushDataConfig(config, `PUSH_DATA_CONFIGS.${sheetName}`);
        } catch (error) {
          results.push(`Invalid PUSH_DATA_CONFIGS.${sheetName}: ${error.message}`);
        }
      });
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
    const tests = [];
    
    // Test spreadsheet ID validation
    try {
      Validators.validateSpreadsheetId('1uCQ_Z4QLbHq89tutZ4Wen0TREwS8qEx2j7MmzUgXOaY');
      tests.push({ name: 'valid spreadsheet ID', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid spreadsheet ID', result: 'FAIL', error: error.message });
    }
    
    // Test invalid spreadsheet ID
    try {
      Validators.validateSpreadsheetId('invalid');
      tests.push({ name: 'invalid spreadsheet ID rejection', result: 'FAIL', error: 'Should have thrown error' });
    } catch (error) {
      tests.push({ name: 'invalid spreadsheet ID rejection', result: 'PASS' });
    }
    
    // Test sheet name validation
    try {
      Validators.validateSheetName('TestSheet');
      tests.push({ name: 'valid sheet name', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid sheet name', result: 'FAIL', error: error.message });
    }
    
    // Test range validation
    try {
      Validators.validateRange('A2:O');
      tests.push({ name: 'valid range', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid range', result: 'FAIL', error: error.message });
    }
    
    const failed = tests.filter(t => t.result === 'FAIL');
    return failed.length === 0 ?
      { status: 'PASS', tests, message: `All ${tests.length} validator tests passed` } :
      { status: 'FAIL', tests, failed: failed.length };
      
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests the DateUtils utility class
 */
function testDateUtils() {
  try {
    const tests = [];
    
    // Test date formatting
    try {
      const formatted = DateUtils.formatDate(new Date('2025-01-01'));
      if (formatted && typeof formatted === 'string') {
        tests.push({ name: 'date formatting', result: 'PASS' });
      } else {
        tests.push({ name: 'date formatting', result: 'FAIL', error: 'Invalid format result' });
      }
    } catch (error) {
      tests.push({ name: 'date formatting', result: 'FAIL', error: error.message });
    }
    
    // Test timestamp creation
    try {
      const timestamp = DateUtils.getCurrentTimestamp();
      if (timestamp && typeof timestamp === 'string') {
        tests.push({ name: 'timestamp creation', result: 'PASS' });
      } else {
        tests.push({ name: 'timestamp creation', result: 'FAIL', error: 'Invalid timestamp' });
      }
    } catch (error) {
      tests.push({ name: 'timestamp creation', result: 'FAIL', error: error.message });
    }
    
    // Test timestamp note creation
    try {
      const note = DateUtils.createTimestampNote('Test');
      if (note && typeof note === 'string' && note.includes('Test')) {
        tests.push({ name: 'timestamp note creation', result: 'PASS' });
      } else {
        tests.push({ name: 'timestamp note creation', result: 'FAIL', error: 'Invalid note format' });
      }
    } catch (error) {
      tests.push({ name: 'timestamp note creation', result: 'FAIL', error: error.message });
    }
    
    const failed = tests.filter(t => t.result === 'FAIL');
    return failed.length === 0 ?
      { status: 'PASS', tests, message: `All ${tests.length} DateUtils tests passed` } :
      { status: 'FAIL', tests, failed: failed.length };
      
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests the ErrorHandler utility class
 */
function testErrorHandler() {
  try {
    const tests = [];
    
    // Test error creation
    try {
      const error = ErrorHandler.createError('Test error', 'TEST_CODE', { test: true });
      if (error instanceof Error && error.code === 'TEST_CODE') {
        tests.push({ name: 'error creation', result: 'PASS' });
      } else {
        tests.push({ name: 'error creation', result: 'FAIL', error: 'Invalid error object' });
      }
    } catch (error) {
      tests.push({ name: 'error creation', result: 'FAIL', error: error.message });
    }
    
    // Test parameter validation
    try {
      ErrorHandler.validateRequired({ test: 'value' }, ['test'], 'test context');
      tests.push({ name: 'valid parameter validation', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'valid parameter validation', result: 'FAIL', error: error.message });
    }
    
    // Test missing parameter detection
    try {
      ErrorHandler.validateRequired({}, ['required'], 'test context');
      tests.push({ name: 'missing parameter detection', result: 'FAIL', error: 'Should have thrown error' });
    } catch (error) {
      tests.push({ name: 'missing parameter detection', result: 'PASS' });
    }
    
    const failed = tests.filter(t => t.result === 'FAIL');
    return failed.length === 0 ?
      { status: 'PASS', tests, message: `All ${tests.length} ErrorHandler tests passed` } :
      { status: 'FAIL', tests, failed: failed.length };
      
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests the AppLogger utility class
 */
function testLogger() {
  try {
    const tests = [];
    
    // Test basic logging methods
    try {
      AppLogger.info('Test info message', { test: true });
      AppLogger.warn('Test warn message');
      AppLogger.debug('Test debug message');
      tests.push({ name: 'basic logging methods', result: 'PASS' });
    } catch (error) {
      tests.push({ name: 'basic logging methods', result: 'FAIL', error: error.message });
    }
    
    // Test timer functionality
    try {
      const timer = AppLogger.startTimer('test operation');
      const duration = timer.stop();
      if (typeof duration === 'number' && duration >= 0) {
        tests.push({ name: 'timer functionality', result: 'PASS' });
      } else {
        tests.push({ name: 'timer functionality', result: 'FAIL', error: 'Invalid timer result' });
      }
    } catch (error) {
      tests.push({ name: 'timer functionality', result: 'FAIL', error: error.message });
    }
    
    const failed = tests.filter(t => t.result === 'FAIL');
    return failed.length === 0 ?
      { status: 'PASS', tests, message: `All ${tests.length} Logger tests passed` } :
      { status: 'FAIL', tests, failed: failed.length };
      
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests Gmail connectivity (read-only)
 */
function testGmailConnectivity() {
  try {
    // Test Gmail access
    const labels = EmailService.getAllLabels();
    
    if (!Array.isArray(labels)) {
      return { status: 'FAIL', error: 'Could not retrieve Gmail labels' };
    }
    
    // Test configured label existence
    const configuredLabels = CONFIG.EMAIL_CONFIGS.map(c => c.label);
    const missingLabels = configuredLabels.filter(label => !EmailService.labelExists(label));
    
    if (missingLabels.length > 0) {
      return { 
        status: 'WARN', 
        message: `${missingLabels.length} configured labels not found`,
        missingLabels 
      };
    }
    
    return { 
      status: 'PASS', 
      message: `Gmail connectivity OK. ${labels.length} labels found, all configured labels exist.`,
      labelCount: labels.length,
      configuredLabelCount: configuredLabels.length
    };
    
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Tests spreadsheet connectivity (read-only)
 */
function testSpreadsheetConnectivity() {
  try {
    const tests = [];
    
    // Test main spreadsheet
    try {
      const metadata = SheetService.getSpreadsheetMetadata(CONFIG.SPREADSHEETS.MAIN);
      tests.push({ 
        name: 'main spreadsheet', 
        result: 'PASS', 
        metadata: {
          name: metadata.name,
          sheetCount: metadata.sheetCount
        }
      });
    } catch (error) {
      tests.push({ name: 'main spreadsheet', result: 'FAIL', error: error.message });
    }
    
    // Test target spreadsheets
    const targetIds = new Set();
    Object.values(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).forEach(config => {
      config.targets.forEach(target => targetIds.add(target.spreadsheetId));
    });
    
    targetIds.forEach(id => {
      try {
        const metadata = SheetService.getSpreadsheetMetadata(id);
        tests.push({ 
          name: `target spreadsheet ${id.substring(0, 8)}...`, 
          result: 'PASS',
          metadata: {
            name: metadata.name,
            sheetCount: metadata.sheetCount
          }
        });
      } catch (error) {
        tests.push({ 
          name: `target spreadsheet ${id.substring(0, 8)}...`, 
          result: 'FAIL', 
          error: error.message 
        });
      }
    });
    
    const failed = tests.filter(t => t.result === 'FAIL');
    return failed.length === 0 ?
      { status: 'PASS', tests, message: `All ${tests.length} spreadsheet tests passed` } :
      { status: 'FAIL', tests, failed: failed.length };
      
  } catch (error) {
    return { status: 'FAIL', error: error.message };
  }
}

/**
 * Displays test results in a user-friendly format
 */
function showTestResults() {
  try {
    const results = runAllTests();
    
    let message = `Test Results (${DateUtils.formatDate()}):\n\n`;
    message += `Overall: ${results.summary.passed}/${results.summary.total} tests passed\n\n`;
    
    Object.entries(results.tests).forEach(([testName, result]) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
      message += `${icon} ${testName}: ${result.status}\n`;
      if (result.message) {
        message += `   ${result.message}\n`;
      }
      if (result.error) {
        message += `   Error: ${result.error}\n`;
      }
    });
    
    if (results.summary.failed > 0) {
      message += '\nSee console logs for detailed error information.';
    }
    
    SpreadsheetApp.getUi().alert("Test Results", message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    return results;
    
  } catch (error) {
    AppLogger.error('Failed to show test results', error);
    SpreadsheetApp.getUi().alert(`Error running tests: ${error.message}`);
  }
}
