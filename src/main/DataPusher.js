/**
 * Data pusher for the NISD API project.
 * Handles manual data push operations from the main spreadsheet to target spreadsheets.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Data pusher class for manual data operations
 */
class DataPusher {
  
  /**
   * Pushes data from source sheets to all configured target spreadsheets
   * This is the main entry point for manual data push operations
   * @returns {Array<Object>} Array of push results for each source sheet
   */
  static pushAllData() {
    const timer = AppLogger.startTimer('pushAllData');
    
    try {
      AppLogger.operationStart('pushAllData', {
        sourceSheetCount: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).length
      });
      
      // Validate configurations before processing
      this._validatePushConfigurations();
      
      const results = [];
      const sourceSheets = CONFIG.PUSH_DATA_CONFIGS.sourceSheets;
      
      // Process each source sheet
      for (const [sheetName, config] of Object.entries(sourceSheets)) {
        try {
          AppLogger.info(`Processing source sheet: ${sheetName}`);
          
          const result = this.pushSingleSheet(sheetName, config);
          
          results.push({
            success: true,
            sourceSheet: sheetName,
            result
          });
          
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error, `Pushing data from ${sheetName}`, {
            sourceSheet: sheetName,
            config
          });
          
          results.push({
            success: false,
            sourceSheet: sheetName,
            error: errorMessage
          });
        }
      }
      
      // Log batch summary
      AppLogger.batchSummary('pushAllData', results);
      
      AppLogger.operationSuccess('pushAllData', {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }, timer.stop());
      
      return results;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('pushAllData', error);
      throw error;
    }
  }
  
  /**
   * Pushes data from a single source sheet to its configured targets
   * @param {string} sourceSheetName - The name of the source sheet
   * @param {Object} config - The push configuration for this sheet
   * @param {string} context - Context for error messages
   * @returns {Object} Push result with metadata
   * @throws {Error} If push operation fails
   */
  static pushSingleSheet(sourceSheetName, config, context = 'Single sheet push') {
    const timer = AppLogger.startTimer(`pushSingleSheet_${sourceSheetName}`);
    
    try {
      AppLogger.operationStart('pushSingleSheet', {
        sourceSheetName,
        targetCount: config.targets.length,
        context
      });
      
      // Validate the configuration
      Validators.validatePushDataConfig(config, context);
      
      // Step 1: Read data from source sheet
      const sourceData = SheetService.readSheetData(
        CONFIG.SPREADSHEETS.MAIN,
        sourceSheetName,
        config.range,
        `${context}.readSource`
      );
      
      AppLogger.dataProcessing('Source data read', sourceData.length, {
        sourceSheet: sourceSheetName,
        range: config.range
      });
      
      // Step 2: Push to each target
      const targetResults = [];
      
      for (let i = 0; i < config.targets.length; i++) {
        const target = config.targets[i];
        const targetContext = `${context}.target[${i}]`;
        
        try {
          const targetResult = this._pushToTarget(sourceData, target, targetContext);
          
          targetResults.push({
            success: true,
            target: {
              spreadsheetId: target.spreadsheetId,
              sheetName: target.sheetName
            },
            result: targetResult
          });
          
        } catch (error) {
          const errorMessage = ErrorHandler.handle(error, targetContext, {
            targetSpreadsheetId: target.spreadsheetId,
            targetSheetName: target.sheetName
          });
          
          targetResults.push({
            success: false,
            target: {
              spreadsheetId: target.spreadsheetId,
              sheetName: target.sheetName
            },
            error: errorMessage
          });
        }
      }
      
      const result = {
        sourceSheet: sourceSheetName,
        sourceRange: config.range,
        sourceRowCount: sourceData.length,
        sourceColumnCount: sourceData.length > 0 ? sourceData[0].length : 0,
        targetResults,
        timestamp: DateUtils.getCurrentTimestamp()
      };
      
      AppLogger.operationSuccess('pushSingleSheet', {
        sourceSheet: sourceSheetName,
        sourceRows: sourceData.length,
        targetsProcessed: targetResults.length,
        successfulTargets: targetResults.filter(r => r.success).length
      }, timer.stop());
      
      return result;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('pushSingleSheet', error, {
        sourceSheetName,
        context
      });
      throw error;
    }
  }
  
  /**
   * Pushes data to a specific target spreadsheet and sheet
   * @private
   * @param {Array<Array<any>>} data - The data to push
   * @param {Object} target - The target configuration
   * @param {string} context - Context for error messages
   * @returns {Object} Push result for this target
   */
  static _pushToTarget(data, target, context) {
    try {
      // Clear existing data in the target sheet (from row 2 down)
      const targetSpreadsheet = SpreadsheetApp.openById(target.spreadsheetId);
      const targetSheet = targetSpreadsheet.getSheetByName(target.sheetName);
      
      Validators.validateSheet(targetSheet, target.sheetName, context);
      
      // Clear data from row 2 down
      const lastRow = targetSheet.getLastRow();
      if (lastRow > 1) {
        const clearRange = targetSheet.getRange(2, 1, lastRow - 1, targetSheet.getMaxColumns());
        clearRange.clearContent();
        
        AppLogger.debug('Target sheet cleared', {
          spreadsheetId: target.spreadsheetId,
          sheetName: target.sheetName,
          clearedRows: lastRow - 1,
          context
        });
      }
      
      // Insert new data starting at row 2
      let insertedRows = 0;
      if (data.length > 0) {
        const targetRange = targetSheet.getRange(2, 1, data.length, data[0].length);
        targetRange.setValues(data);
        insertedRows = data.length;
        
        AppLogger.dataProcessing('Data pushed to target', insertedRows, {
          spreadsheetId: target.spreadsheetId,
          sheetName: target.sheetName,
          columns: data[0].length
        });
      }
      
      // Add timestamp note
      const timestampNote = DateUtils.createScriptTimestampNote();
      targetSheet.getRange('A1').setNote(timestampNote);
      
      return {
        spreadsheetId: target.spreadsheetId,
        sheetName: target.sheetName,
        rowsInserted: insertedRows,
        columnsInserted: data.length > 0 ? data[0].length : 0,
        timestamp: DateUtils.getCurrentTimestamp()
      };
      
    } catch (error) {
      throw ErrorHandler.createError(
        `Failed to push data to target: ${error.message}`,
        ERROR_CODES.GENERAL_ERROR,
        {
          targetSpreadsheetId: target.spreadsheetId,
          targetSheetName: target.sheetName,
          dataRows: data.length,
          originalError: error.message
        }
      );
    }
  }
  
  /**
   * Validates all push data configurations
   * @private
   * @throws {Error} If any configuration is invalid
   */
  static _validatePushConfigurations() {
    AppLogger.info('Validating push data configurations');
    
    if (!CONFIG.PUSH_DATA_CONFIGS || !CONFIG.PUSH_DATA_CONFIGS.sourceSheets) {
      throw ErrorHandler.createError(
        'No push data configurations found',
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    const sourceSheets = CONFIG.PUSH_DATA_CONFIGS.sourceSheets;
    
    if (Object.keys(sourceSheets).length === 0) {
      throw ErrorHandler.createError(
        'No source sheets configured',
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    // Validate main spreadsheet exists
    SheetService.getSpreadsheetMetadata(CONFIG.SPREADSHEETS.MAIN);
    
    // Validate each source sheet configuration
    for (const [sheetName, config] of Object.entries(sourceSheets)) {
      try {
        Validators.validatePushDataConfig(config, `sourceSheets.${sheetName}`);
        
        // Validate that target spreadsheets exist
        config.targets.forEach((target, index) => {
          try {
            SheetService.getSpreadsheetMetadata(target.spreadsheetId);
          } catch (error) {
            throw ErrorHandler.createError(
              `Target spreadsheet not accessible: ${target.spreadsheetId}`,
              ERROR_CODES.SPREADSHEET_NOT_FOUND,
              { 
                sourceSheet: sheetName,
                targetIndex: index,
                targetSpreadsheetId: target.spreadsheetId
              }
            );
          }
        });
        
      } catch (error) {
        throw ErrorHandler.createError(
          `Push configuration validation failed for sheet: ${sheetName}`,
          ERROR_CODES.MISSING_PARAMETERS,
          { 
            sourceSheet: sheetName,
            config,
            originalError: error.message
          }
        );
      }
    }
    
    // Validate that all source sheets exist in the main spreadsheet
    const requiredSourceSheets = Object.keys(sourceSheets);
    SheetService.validateRequiredSheets(
      CONFIG.SPREADSHEETS.MAIN,
      requiredSourceSheets,
      'Push data validation'
    );
    
    AppLogger.info('Push data configurations validated successfully', {
      sourceSheetCount: requiredSourceSheets.length,
      sourceSheets: requiredSourceSheets
    });
  }
  
  /**
   * Gets push data status for all configured sheets
   * @returns {Object} Status information for push data configurations
   */
  static getPushDataStatus() {
    try {
      const status = {
        timestamp: DateUtils.getCurrentTimestamp(),
        sourceSheets: []
      };
      
      const sourceSheets = CONFIG.PUSH_DATA_CONFIGS.sourceSheets;
      
      for (const [sheetName, config] of Object.entries(sourceSheets)) {
        try {
          // Read current data from source
          const sourceData = SheetService.readSheetData(
            CONFIG.SPREADSHEETS.MAIN,
            sheetName,
            config.range,
            'getPushDataStatus'
          );
          
          const sheetStatus = {
            sheetName,
            range: config.range,
            currentRowCount: sourceData.length,
            currentColumnCount: sourceData.length > 0 ? sourceData[0].length : 0,
            targetCount: config.targets.length,
            targets: []
          };
          
          // Check each target
          config.targets.forEach((target, index) => {
            try {
              const targetMetadata = SheetService.getSpreadsheetMetadata(target.spreadsheetId);
              sheetStatus.targets.push({
                index,
                spreadsheetId: target.spreadsheetId,
                sheetName: target.sheetName,
                accessible: true,
                spreadsheetName: targetMetadata.name
              });
            } catch (error) {
              sheetStatus.targets.push({
                index,
                spreadsheetId: target.spreadsheetId,
                sheetName: target.sheetName,
                accessible: false,
                error: error.message
              });
            }
          });
          
          status.sourceSheets.push(sheetStatus);
          
        } catch (error) {
          status.sourceSheets.push({
            sheetName,
            error: error.message
          });
        }
      }
      
      return status;
      
    } catch (error) {
      AppLogger.error('Failed to get push data status', error);
      throw error;
    }
  }
  
  /**
   * Pushes data from a specific source sheet (for individual testing)
   * @param {string} sourceSheetName - The name of the source sheet to push
   * @returns {Object} Push result
   * @throws {Error} If push operation fails
   */
  static pushSpecificSheet(sourceSheetName) {
    try {
      AppLogger.operationStart('pushSpecificSheet', { sourceSheetName });
      
      const config = CONFIG.PUSH_DATA_CONFIGS.sourceSheets[sourceSheetName];
      
      if (!config) {
        throw ErrorHandler.createError(
          `No configuration found for source sheet: ${sourceSheetName}`,
          ERROR_CODES.MISSING_PARAMETERS,
          { 
            sourceSheetName,
            availableSheets: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets)
          }
        );
      }
      
      const result = this.pushSingleSheet(sourceSheetName, config, `pushSpecificSheet_${sourceSheetName}`);
      
      AppLogger.operationSuccess('pushSpecificSheet', result);
      return result;
      
    } catch (error) {
      AppLogger.operationFailure('pushSpecificSheet', error, { sourceSheetName });
      throw error;
    }
  }
  
  /**
   * Creates the success dialog HTML content
   * @returns {string} HTML content for the success dialog
   */
  static createSuccessDialogContent() {
    const links = CONFIG.SUCCESS_LINKS.map(link => 
      `<li><a href="${link.url}" target="_blank">${link.name}</a></li>`
    ).join('');
    
    return `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Data was pushed successfully to the reports.</p>
        <ul>
          ${links}
        </ul>
      </div>
    `;
  }
}
