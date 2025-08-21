/**
 * Google Sheets Service for NISD API Project
 * Provides methods for reading, writing, and managing spreadsheet data.
 * Compatible with Google Apps Script V8 runtime.
 *
 * @file Sheet service for NISD API project.
 * @author Alvaro Gomez, Academic Technology Coach
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * Updates a specific sheet with new data.
 * @function SheetService_updateSheet
 * @param {string} spreadsheetId - The ID of the target spreadsheet.
 * @param {string} sheetName - The name of the sheet to update.
 * @param {string} rangeToClear - The range to clear before inserting new data.
 * @param {Array<Array<any>>} data - The data to insert.
 * @param {string} [context] - Context for error messages.
 * @returns {Object} Operation result with metadata.
 * @throws {Error} If the operation fails.
 * @example
 * var data = [['Name', 'Age'], ['John', 25], ['Jane', 30]];
 * var result = SheetService_updateSheet(
 *   '1ABC...XYZ',
 *   'Students',
 *   'A2:Z',
 *   data,
 *   'Student data update'
 * );
 */
function SheetService_updateSheet(spreadsheetId, sheetName, rangeToClear, data, context) {
  context = context || 'Sheet update';
  var timer = AppLogger_startTimer('updateSheet_' + sheetName);
  
  try {
    AppLogger_operationStart('updateSheet', {
      spreadsheetId: spreadsheetId,
      sheetName: sheetName,
      rangeToClear: rangeToClear,
      rowCount: data.length,
      context: context
    });
    
    // Validate inputs
    Validators_validateSpreadsheetId(spreadsheetId, context + '.spreadsheetId');
    Validators_validateSheetName(sheetName, context + '.sheetName');
    Validators_validateRange(rangeToClear, context + '.rangeToClear');
    Validators_validateDataArray(data, context + '.data');
    
    // Open the spreadsheet and get the sheet
    var spreadsheet = SheetService__openSpreadsheet(spreadsheetId, context);
    var sheet = SheetService__getSheet(spreadsheet, sheetName, context);
    
    // Clear the existing data
    SheetService__clearRange(sheet, rangeToClear, context);
    
    // Insert new data if provided
    var insertedRows = 0;
    if (data.length > 0) {
      insertedRows = SheetService__insertData(sheet, data, context);
    }
    
    // Add timestamp note
    SheetService__addTimestampNote(sheet, context);
    
    var result = {
      spreadsheetId: spreadsheetId,
      sheetName: sheetName,
      rowsInserted: insertedRows,
      columnsInserted: data.length > 0 ? data[0].length : 0,
      rangeToClear: rangeToClear,
      timestamp: DateUtils_getCurrentTimestamp()
    };
    
    AppLogger_operationSuccess('updateSheet', result, timer.stop());
    return result;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('updateSheet', error, {
      spreadsheetId: spreadsheetId,
      sheetName: sheetName,
      context: context
    });
    throw error;
  }
}

/**
 * Reads data from a specific sheet range.
 * @param {string} spreadsheetId - The ID of the source spreadsheet.
 * @param {string} sheetName - The name of the sheet to read from.
 * @param {string} range - The range to read (e.g., "A2:O").
 * @param {string} [context] - Context for error messages.
 * @returns {Array<Array<any>>} The data from the specified range.
 * @throws {Error} If the operation fails.
 */
function SheetService_readSheetData(spreadsheetId, sheetName, range, context) {
  context = context || 'Sheet read';
  var timer = AppLogger_startTimer('readSheetData_' + sheetName);
  
  try {
    AppLogger_operationStart('readSheetData', {
      spreadsheetId: spreadsheetId,
      sheetName: sheetName,
      range: range,
      context: context
    });
    
    // Validate inputs
    Validators_validateSpreadsheetId(spreadsheetId, context + '.spreadsheetId');
    Validators_validateSheetName(sheetName, context + '.sheetName');
    Validators_validateRange(range, context + '.range');
    
    // Open the spreadsheet and get the sheet
    var spreadsheet = SheetService__openSpreadsheet(spreadsheetId, context);
    var sheet = SheetService__getSheet(spreadsheet, sheetName, context);
    
    // Read the data
    var dataRange = sheet.getRange(range);
    var data = dataRange.getValues();
    
    // Filter out empty rows
    var nonEmptyData = data.filter(function(row) {
      return row.some(function(cell) {
        return cell !== null && cell !== undefined && cell !== '';
      });
    });
    
    AppLogger_operationSuccess('readSheetData', {
      totalRows: data.length,
      nonEmptyRows: nonEmptyData.length,
      columns: data.length > 0 ? data[0].length : 0
    }, timer.stop());
    
    return nonEmptyData;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('readSheetData', error, {
      spreadsheetId: spreadsheetId,
      sheetName: sheetName,
      range: range,
      context: context
    });
    throw error;
  }
}

/**
 * Batch updates multiple sheets with validation.
 * @param {Array<Object>} updateOperations - Array of update operation objects.
 * @param {string} [context] - Context for error messages.
 * @returns {Array<Object>} Array of operation results.
 */
function SheetService_batchUpdateSheets(updateOperations, context) {
  context = context || 'Batch sheet update';
  var timer = AppLogger_startTimer('batchUpdateSheets');
  
  try {
    AppLogger_operationStart('batchUpdateSheets', {
      operationCount: updateOperations.length,
      context: context
    });
    
    if (!Array.isArray(updateOperations) || updateOperations.length === 0) {
      throw ErrorHandler_createError(
        'updateOperations must be a non-empty array',
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    var results = [];
    
    for (var i = 0; i < updateOperations.length; i++) {
      var operation = updateOperations[i];
      var operationContext = context + '.operation[' + i + ']';
      
      try {
        // Validate operation structure
        ErrorHandler_validateRequired(
          operation,
          ['spreadsheetId', 'sheetName', 'rangeToClear', 'data'],
          operationContext
        );
        
        var result = SheetService_updateSheet(
          operation.spreadsheetId,
          operation.sheetName,
          operation.rangeToClear,
          operation.data,
          operationContext
        );
        
        results.push({
          success: true,
          operation: operation.sheetName,
          result: result
        });
        
      } catch (error) {
        var errorMessage = ErrorHandler_handle(error, operationContext);
        results.push({
          success: false,
          operation: operation.sheetName || ('operation[' + i + ']'),
          error: errorMessage
        });
      }
    }
    
    // Log batch summary
    AppLogger_batchSummary('batchUpdateSheets', results);
    
    AppLogger_operationSuccess('batchUpdateSheets', {
      total: results.length,
      successful: results.filter(function(r) { return r.success; }).length,
      failed: results.filter(function(r) { return !r.success; }).length
    }, timer.stop());
    
    return results;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('batchUpdateSheets', error, { context: context });
    throw error;
  }
}

/**
 * Opens a spreadsheet by ID with error handling.
 * @private
 * @param {string} spreadsheetId - The spreadsheet ID.
 * @param {string} context - Context for error messages.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The opened spreadsheet.
 * @throws {Error} If the spreadsheet cannot be opened.
 */
function SheetService__openSpreadsheet(spreadsheetId, context) {
  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    throw ErrorHandler_createError(
      context + ': Failed to open spreadsheet',
      ERROR_CODES.SPREADSHEET_NOT_FOUND,
      { 
        spreadsheetId: spreadsheetId,
        originalError: error.message 
      }
    );
  }
}

/**
 * Gets a sheet by name with validation.
 * @private
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - The spreadsheet object.
 * @param {string} sheetName - The name of the sheet.
 * @param {string} context - Context for error messages.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
 * @throws {Error} If the sheet is not found.
 */
function SheetService__getSheet(spreadsheet, sheetName, context) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  Validators_validateSheet(sheet, sheetName, context);
  return sheet;
}

/**
 * Clears a range in a sheet.
 * @private
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object.
 * @param {string} rangeToClear - The range to clear.
 * @param {string} context - Context for error messages.
 * @returns {void}
 */
function SheetService__clearRange(sheet, rangeToClear, context) {
  try {
    var range = sheet.getRange(rangeToClear);
    range.clearContent();
    
    AppLogger_debug('Range cleared', {
      sheetName: sheet.getName(),
      range: rangeToClear,
      context: context
    });
  } catch (error) {
    throw ErrorHandler_createError(
      context + ': Failed to clear range ' + rangeToClear,
      ERROR_CODES.GENERAL_ERROR,
      { 
        sheetName: sheet.getName(),
        rangeToClear: rangeToClear,
        originalError: error.message 
      }
    );
  }
}

/**
 * Inserts data into a sheet starting at row 2.
 * @private
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object.
 * @param {Array<Array<any>>} data - The data to insert.
 * @param {string} context - Context for error messages.
 * @returns {number} Number of rows inserted.
 */
function SheetService__insertData(sheet, data, context) {
  try {
    if (data.length === 0) {
      return 0;
    }
    
    var startRow = 2; // Start at row 2 to preserve headers
    var startColumn = 1;
    var numRows = data.length;
    var numColumns = data[0].length;
    
    var range = sheet.getRange(startRow, startColumn, numRows, numColumns);
    range.setValues(data);
    
    AppLogger_dataProcessing('Data inserted into sheet', numRows, {
      sheetName: sheet.getName(),
      columns: numColumns,
      startRow: startRow,
      context: context
    });
    
    return numRows;
  } catch (error) {
    throw ErrorHandler_createError(
      context + ': Failed to insert data into sheet',
      ERROR_CODES.GENERAL_ERROR,
      { 
        sheetName: sheet.getName(),
        dataRows: data.length,
        dataColumns: data.length > 0 ? data[0].length : 0,
        originalError: error.message 
      }
    );
  }
}

/**
 * Adds a timestamp note to cell A1.
 * @private
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object.
 * @param {string} context - Context for error messages.
 * @returns {void}
 */
function SheetService__addTimestampNote(sheet, context) {
  try {
    var timestampNote = DateUtils_createTimestampNote('Updated');
    sheet.getRange('A1').setNote(timestampNote);
    
    AppLogger_debug('Timestamp note added', {
      sheetName: sheet.getName(),
      note: timestampNote,
      context: context
    });
  } catch (error) {
    // Don't fail the operation for timestamp note errors
    AppLogger_warn('Failed to add timestamp note', {
      sheetName: sheet.getName(),
      error: error.message,
      context: context
    });
  }
}

/**
 * Gets spreadsheet metadata.
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @returns {Object} Spreadsheet metadata.
 * @throws {Error} If the spreadsheet cannot be accessed.
 */
function SheetService_getSpreadsheetMetadata(spreadsheetId) {
  try {
    Validators_validateSpreadsheetId(spreadsheetId, 'getSpreadsheetMetadata');
    
    var spreadsheet = SheetService__openSpreadsheet(spreadsheetId, 'getSpreadsheetMetadata');
    var sheets = spreadsheet.getSheets();
    
    return {
      id: spreadsheet.getId(),
      name: spreadsheet.getName(),
      url: spreadsheet.getUrl(),
      sheetCount: sheets.length,
      sheetNames: sheets.map(function(sheet) { return sheet.getName(); })
    };
  } catch (error) {
    throw ErrorHandler_createError(
      'Failed to get spreadsheet metadata',
      ERROR_CODES.SPREADSHEET_NOT_FOUND,
      { spreadsheetId: spreadsheetId, originalError: error.message }
    );
  }
}

/**
 * Validates that all required sheets exist in a spreadsheet.
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {Array<string>} requiredSheets - Array of required sheet names.
 * @param {string} [context] - Context for error messages.
 * @throws {Error} If any required sheets are missing.
 * @returns {void}
 */
function SheetService_validateRequiredSheets(spreadsheetId, requiredSheets, context) {
  context = context || 'Sheet validation';
  var spreadsheet = SheetService__openSpreadsheet(spreadsheetId, context);
  var existingSheets = spreadsheet.getSheets().map(function(sheet) { return sheet.getName(); });
  
  var missingSheets = requiredSheets.filter(function(sheetName) {
    return existingSheets.indexOf(sheetName) === -1;
  });
  
  if (missingSheets.length > 0) {
    throw ErrorHandler_createError(
      context + ': Missing required sheets: ' + missingSheets.join(', '),
      ERROR_CODES.SHEET_NOT_FOUND,
      { 
        spreadsheetId: spreadsheetId,
        missingSheets: missingSheets,
        existingSheets: existingSheets,
        requiredSheets: requiredSheets
      }
    );
  }
  
  AppLogger_info('Required sheets validation passed', {
    spreadsheetId: spreadsheetId,
    requiredSheets: requiredSheets,
    context: context
  });
}

/**
 * SheetService object for backward compatibility and easier access.
 * @namespace SheetService
 */
var SheetService = {
  updateSheet: SheetService_updateSheet,
  readSheetData: SheetService_readSheetData,
  batchUpdateSheets: SheetService_batchUpdateSheets,
  getSpreadsheetMetadata: SheetService_getSpreadsheetMetadata,
  validateRequiredSheets: SheetService_validateRequiredSheets,
  _openSpreadsheet: SheetService__openSpreadsheet,
  _getSheet: SheetService__getSheet,
  _clearRange: SheetService__clearRange,
  _insertData: SheetService__insertData,
  _addTimestampNote: SheetService__addTimestampNote
};
