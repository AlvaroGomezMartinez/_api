/**
 * Google Sheets service for handling spreadsheet operations in the NISD API project.
 * Provides methods for reading, writing, and managing spreadsheet data.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Google Sheets service class for spreadsheet operations
 */
class SheetService {
  
  /**
   * Updates a specific sheet with new data
   * @param {string} spreadsheetId - The ID of the target spreadsheet
   * @param {string} sheetName - The name of the sheet to update
   * @param {string} rangeToClear - The range to clear before inserting new data
   * @param {Array<Array<any>>} data - The data to insert
   * @param {string} context - Context for error messages
   * @returns {Object} Operation result with metadata
   * @throws {Error} If the operation fails
   */
  static updateSheet(spreadsheetId, sheetName, rangeToClear, data, context = 'Sheet update') {
    const timer = AppLogger.startTimer(`updateSheet_${sheetName}`);
    
    try {
      AppLogger.operationStart('updateSheet', {
        spreadsheetId,
        sheetName,
        rangeToClear,
        rowCount: data.length,
        context
      });
      
      // Validate inputs
      Validators.validateSpreadsheetId(spreadsheetId, `${context}.spreadsheetId`);
      Validators.validateSheetName(sheetName, `${context}.sheetName`);
      Validators.validateRange(rangeToClear, `${context}.rangeToClear`);
      Validators.validateDataArray(data, `${context}.data`);
      
      // Open the spreadsheet and get the sheet
      const spreadsheet = this._openSpreadsheet(spreadsheetId, context);
      const sheet = this._getSheet(spreadsheet, sheetName, context);
      
      // Clear the existing data
      this._clearRange(sheet, rangeToClear, context);
      
      // Insert new data if provided
      let insertedRows = 0;
      if (data.length > 0) {
        insertedRows = this._insertData(sheet, data, context);
      }
      
      // Add timestamp note
      this._addTimestampNote(sheet, context);
      
      const result = {
        spreadsheetId,
        sheetName,
        rowsInserted: insertedRows,
        columnsInserted: data.length > 0 ? data[0].length : 0,
        rangeToClear,
        timestamp: DateUtils.getCurrentTimestamp()
      };
      
      AppLogger.operationSuccess('updateSheet', result, timer.stop());
      return result;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('updateSheet', error, {
        spreadsheetId,
        sheetName,
        context
      });
      throw error;
    }
  }
  
  /**
   * Reads data from a specific sheet range
   * @param {string} spreadsheetId - The ID of the source spreadsheet
   * @param {string} sheetName - The name of the sheet to read from
   * @param {string} range - The range to read (e.g., "A2:O")
   * @param {string} context - Context for error messages
   * @returns {Array<Array<any>>} The data from the specified range
   * @throws {Error} If the operation fails
   */
  static readSheetData(spreadsheetId, sheetName, range, context = 'Sheet read') {
    const timer = AppLogger.startTimer(`readSheetData_${sheetName}`);
    
    try {
      AppLogger.operationStart('readSheetData', {
        spreadsheetId,
        sheetName,
        range,
        context
      });
      
      // Validate inputs
      Validators.validateSpreadsheetId(spreadsheetId, `${context}.spreadsheetId`);
      Validators.validateSheetName(sheetName, `${context}.sheetName`);
      Validators.validateRange(range, `${context}.range`);
      
      // Open the spreadsheet and get the sheet
      const spreadsheet = this._openSpreadsheet(spreadsheetId, context);
      const sheet = this._getSheet(spreadsheet, sheetName, context);
      
      // Read the data
      const dataRange = sheet.getRange(range);
      const data = dataRange.getValues();
      
      // Filter out empty rows
      const nonEmptyData = data.filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );
      
      AppLogger.operationSuccess('readSheetData', {
        totalRows: data.length,
        nonEmptyRows: nonEmptyData.length,
        columns: data.length > 0 ? data[0].length : 0
      }, timer.stop());
      
      return nonEmptyData;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('readSheetData', error, {
        spreadsheetId,
        sheetName,
        range,
        context
      });
      throw error;
    }
  }
  
  /**
   * Batch updates multiple sheets with validation
   * @param {Array<Object>} updateOperations - Array of update operation objects
   * @param {string} context - Context for error messages
   * @returns {Array<Object>} Array of operation results
   */
  static batchUpdateSheets(updateOperations, context = 'Batch sheet update') {
    const timer = AppLogger.startTimer('batchUpdateSheets');
    
    try {
      AppLogger.operationStart('batchUpdateSheets', {
        operationCount: updateOperations.length,
        context
      });
      
      if (!Array.isArray(updateOperations) || updateOperations.length === 0) {
        throw ErrorHandler.createError(
          'updateOperations must be a non-empty array',
          ERROR_CODES.MISSING_PARAMETERS
        );
      }
      
      const results = [];
      
      for (let i = 0; i < updateOperations.length; i++) {
        const operation = updateOperations[i];
        const operationContext = `${context}.operation[${i}]`;
        
        try {
          // Validate operation structure
          ErrorHandler.validateRequired(
            operation,
            ['spreadsheetId', 'sheetName', 'rangeToClear', 'data'],
            operationContext
          );
          
          const result = this.updateSheet(
            operation.spreadsheetId,
            operation.sheetName,
            operation.rangeToClear,
            operation.data,
            operationContext
          );
          
          results.push({
            success: true,
            operation: operation.sheetName,
            result
          });
          
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error, operationContext);
          results.push({
            success: false,
            operation: operation.sheetName || `operation[${i}]`,
            error: errorMessage
          });
        }
      }
      
      // Log batch summary
      AppLogger.batchSummary('batchUpdateSheets', results);
      
      AppLogger.operationSuccess('batchUpdateSheets', {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }, timer.stop());
      
      return results;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('batchUpdateSheets', error, { context });
      throw error;
    }
  }
  
  /**
   * Opens a spreadsheet by ID with error handling
   * @private
   * @param {string} spreadsheetId - The spreadsheet ID
   * @param {string} context - Context for error messages
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The opened spreadsheet
   * @throws {Error} If the spreadsheet cannot be opened
   */
  static _openSpreadsheet(spreadsheetId, context) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      throw ErrorHandler.createError(
        `${context}: Failed to open spreadsheet`,
        ERROR_CODES.SPREADSHEET_NOT_FOUND,
        { 
          spreadsheetId,
          originalError: error.message 
        }
      );
    }
  }
  
  /**
   * Gets a sheet by name with validation
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - The spreadsheet object
   * @param {string} sheetName - The name of the sheet
   * @param {string} context - Context for error messages
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object
   * @throws {Error} If the sheet is not found
   */
  static _getSheet(spreadsheet, sheetName, context) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    Validators.validateSheet(sheet, sheetName, context);
    return sheet;
  }
  
  /**
   * Clears a range in a sheet
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object
   * @param {string} rangeToClear - The range to clear
   * @param {string} context - Context for error messages
   */
  static _clearRange(sheet, rangeToClear, context) {
    try {
      const range = sheet.getRange(rangeToClear);
      range.clearContent();
      
      AppLogger.debug('Range cleared', {
        sheetName: sheet.getName(),
        range: rangeToClear,
        context
      });
    } catch (error) {
      throw ErrorHandler.createError(
        `${context}: Failed to clear range ${rangeToClear}`,
        ERROR_CODES.GENERAL_ERROR,
        { 
          sheetName: sheet.getName(),
          rangeToClear,
          originalError: error.message 
        }
      );
    }
  }
  
  /**
   * Inserts data into a sheet starting at row 2
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object
   * @param {Array<Array<any>>} data - The data to insert
   * @param {string} context - Context for error messages
   * @returns {number} Number of rows inserted
   */
  static _insertData(sheet, data, context) {
    try {
      if (data.length === 0) {
        return 0;
      }
      
      const startRow = 2; // Start at row 2 to preserve headers
      const startColumn = 1;
      const numRows = data.length;
      const numColumns = data[0].length;
      
      const range = sheet.getRange(startRow, startColumn, numRows, numColumns);
      range.setValues(data);
      
      AppLogger.dataProcessing('Data inserted into sheet', numRows, {
        sheetName: sheet.getName(),
        columns: numColumns,
        startRow,
        context
      });
      
      return numRows;
    } catch (error) {
      throw ErrorHandler.createError(
        `${context}: Failed to insert data into sheet`,
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
   * Adds a timestamp note to cell A1
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object
   * @param {string} context - Context for error messages
   */
  static _addTimestampNote(sheet, context) {
    try {
      const timestampNote = DateUtils.createTimestampNote('Updated');
      sheet.getRange('A1').setNote(timestampNote);
      
      AppLogger.debug('Timestamp note added', {
        sheetName: sheet.getName(),
        note: timestampNote,
        context
      });
    } catch (error) {
      // Don't fail the operation for timestamp note errors
      AppLogger.warn('Failed to add timestamp note', {
        sheetName: sheet.getName(),
        error: error.message,
        context
      });
    }
  }
  
  /**
   * Gets spreadsheet metadata
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @returns {Object} Spreadsheet metadata
   * @throws {Error} If the spreadsheet cannot be accessed
   */
  static getSpreadsheetMetadata(spreadsheetId) {
    try {
      Validators.validateSpreadsheetId(spreadsheetId, 'getSpreadsheetMetadata');
      
      const spreadsheet = this._openSpreadsheet(spreadsheetId, 'getSpreadsheetMetadata');
      const sheets = spreadsheet.getSheets();
      
      return {
        id: spreadsheet.getId(),
        name: spreadsheet.getName(),
        url: spreadsheet.getUrl(),
        sheetCount: sheets.length,
        sheetNames: sheets.map(sheet => sheet.getName()),
        lastUpdated: spreadsheet.getLastUpdated()
      };
    } catch (error) {
      throw ErrorHandler.createError(
        'Failed to get spreadsheet metadata',
        ERROR_CODES.SPREADSHEET_NOT_FOUND,
        { spreadsheetId, originalError: error.message }
      );
    }
  }
  
  /**
   * Validates that all required sheets exist in a spreadsheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {Array<string>} requiredSheets - Array of required sheet names
   * @param {string} context - Context for error messages
   * @throws {Error} If any required sheets are missing
   */
  static validateRequiredSheets(spreadsheetId, requiredSheets, context = 'Sheet validation') {
    const spreadsheet = this._openSpreadsheet(spreadsheetId, context);
    const existingSheets = spreadsheet.getSheets().map(sheet => sheet.getName());
    
    const missingSheets = requiredSheets.filter(sheetName => 
      !existingSheets.includes(sheetName)
    );
    
    if (missingSheets.length > 0) {
      throw ErrorHandler.createError(
        `${context}: Missing required sheets: ${missingSheets.join(', ')}`,
        ERROR_CODES.SHEET_NOT_FOUND,
        { 
          spreadsheetId,
          missingSheets,
          existingSheets,
          requiredSheets
        }
      );
    }
    
    AppLogger.info('Required sheets validation passed', {
      spreadsheetId,
      requiredSheets,
      context
    });
  }
}
