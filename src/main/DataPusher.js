/**
 * @fileoverview Data Pusher for NISD API Project
 * @description Data pusher for the NISD API project.
 * Handles manual data push operations from the main spreadsheet to target spreadsheets.
 * Compatible with Google Apps Script V8 runtime.
 * @author Alvaro Gomez, Academic Technology Coach
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * @function DataPusher_pushAllData
 * @description Pushes data from source sheets to all configured target spreadsheets.
 * This is the main entry point for manual data push operations.
 * @returns {Array<Object>} Array of push results for each source sheet
 * @example
 * var results = DataPusher_pushAllData();
 * var successful = results.filter(function(r) { return r.success; }).length;
 * console.log('Successfully pushed ' + successful + ' out of ' + results.length + ' sheets');
 */
function DataPusher_pushAllData() {
  var timer = AppLogger_startTimer('pushAllData');
  
  try {
    AppLogger_operationStart('pushAllData', {
      sourceSheetCount: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets).length
    });
    
    // Validate configurations before processing
    DataPusher__validatePushConfigurations();
    
    var results = [];
    var sourceSheets = CONFIG.PUSH_DATA_CONFIGS.sourceSheets;
    
    // Process each source sheet
    for (var sheetName in sourceSheets) {
      if (sourceSheets.hasOwnProperty(sheetName)) {
        var config = sourceSheets[sheetName];
        
        try {
          AppLogger_info('Processing source sheet: ' + sheetName);
          
          var result = DataPusher_pushSingleSheet(sheetName, config);
          
          results.push({
            success: true,
            sourceSheet: sheetName,
            result: result
          });
          
        } catch (error) {
          var errorMessage = ErrorHandler_handle(error, 'Pushing data from ' + sheetName, {
            sourceSheet: sheetName,
            config: config
          });
          
          results.push({
            success: false,
            sourceSheet: sheetName,
            error: errorMessage
          });
        }
      }
    }
    
    // Log batch summary
    AppLogger_batchSummary('pushAllData', results);
    
    AppLogger_operationSuccess('pushAllData', {
      total: results.length,
      successful: results.filter(function(r) { return r.success; }).length,
      failed: results.filter(function(r) { return !r.success; }).length
    }, timer.stop());
    
    return results;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('pushAllData', error);
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
function DataPusher_pushSingleSheet(sourceSheetName, config, context) {
  context = context || 'Single sheet push';
  var timer = AppLogger_startTimer('pushSingleSheet_' + sourceSheetName);
  
  try {
    AppLogger_operationStart('pushSingleSheet', {
      sourceSheetName: sourceSheetName,
      targetCount: config.targets.length,
      context: context
    });
    
    // Validate the configuration
    Validators_validatePushDataConfig(config, context);
    
    // Step 1: Read data from source sheet
    var sourceData = SheetService_readSheetData(
      CONFIG.SPREADSHEETS.MAIN,
      sourceSheetName,
      config.range,
      context + '.readSource'
    );
    
    AppLogger_dataProcessing('Source data read', sourceData.length, {
      sourceSheet: sourceSheetName,
      range: config.range
    });
    
    // Step 2: Push to each target
    var targetResults = [];
    
    for (var i = 0; i < config.targets.length; i++) {
      var target = config.targets[i];
      var targetContext = context + '.target[' + i + ']';
      
      try {
        var targetResult = DataPusher__pushToTarget(sourceData, target, targetContext);
        
        targetResults.push({
          success: true,
          target: {
            spreadsheetId: target.spreadsheetId,
            sheetName: target.sheetName
          },
          result: targetResult
        });
        
      } catch (error) {
        var errorMessage = ErrorHandler_handle(error, targetContext, {
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
    
    var result = {
      sourceSheet: sourceSheetName,
      sourceRange: config.range,
      sourceRowCount: sourceData.length,
      sourceColumnCount: sourceData.length > 0 ? sourceData[0].length : 0,
      targetResults: targetResults,
      timestamp: DateUtils_getCurrentTimestamp()
    };
    
    AppLogger_operationSuccess('pushSingleSheet', {
      sourceSheet: sourceSheetName,
      sourceRows: sourceData.length,
      targetsProcessed: targetResults.length,
      successfulTargets: targetResults.filter(function(r) { return r.success; }).length
    }, timer.stop());
    
    return result;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('pushSingleSheet', error, {
      sourceSheetName: sourceSheetName,
      context: context
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
function DataPusher__pushToTarget(data, target, context) {
  try {
    // Clear existing data in the target sheet (from row 2 down)
    var targetSpreadsheet = SpreadsheetApp.openById(target.spreadsheetId);
    var targetSheet = targetSpreadsheet.getSheetByName(target.sheetName);
    
    Validators_validateSheet(targetSheet, target.sheetName, context);
    
    // Clear data from row 2 down
    var lastRow = targetSheet.getLastRow();
    if (lastRow > 1) {
      var clearRange = targetSheet.getRange(2, 1, lastRow - 1, targetSheet.getMaxColumns());
      clearRange.clearContent();
      
      AppLogger_debug('Target sheet cleared', {
        spreadsheetId: target.spreadsheetId,
        sheetName: target.sheetName,
        clearedRows: lastRow - 1,
        context: context
      });
    }
    
    // Insert new data starting at row 2
    var insertedRows = 0;
    if (data.length > 0) {
      var targetRange = targetSheet.getRange(2, 1, data.length, data[0].length);
      targetRange.setValues(data);
      insertedRows = data.length;
      
      AppLogger_dataProcessing('Data pushed to target', insertedRows, {
        spreadsheetId: target.spreadsheetId,
        sheetName: target.sheetName,
        columns: data[0].length
      });
    }
    
    // Add timestamp note
    var timestampNote = DateUtils_createScriptTimestampNote();
    targetSheet.getRange('A1').setNote(timestampNote);
    
    return {
      spreadsheetId: target.spreadsheetId,
      sheetName: target.sheetName,
      rowsInserted: insertedRows,
      columnsInserted: data.length > 0 ? data[0].length : 0,
      timestamp: DateUtils_getCurrentTimestamp()
    };
    
  } catch (error) {
    throw ErrorHandler_createError(
      'Failed to push data to target: ' + error.message,
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
function DataPusher__validatePushConfigurations() {
  AppLogger_info('Validating push data configurations');
  
  if (!CONFIG.PUSH_DATA_CONFIGS || !CONFIG.PUSH_DATA_CONFIGS.sourceSheets) {
    throw ErrorHandler_createError(
      'No push data configurations found',
      ERROR_CODES.MISSING_PARAMETERS
    );
  }
  
  var sourceSheets = CONFIG.PUSH_DATA_CONFIGS.sourceSheets;
  
  if (Object.keys(sourceSheets).length === 0) {
    throw ErrorHandler_createError(
      'No source sheets configured',
      ERROR_CODES.MISSING_PARAMETERS
    );
  }
  
  // Validate main spreadsheet exists
  SheetService_getSpreadsheetMetadata(CONFIG.SPREADSHEETS.MAIN);
  
  // Validate each source sheet configuration
  for (var sheetName in sourceSheets) {
    if (sourceSheets.hasOwnProperty(sheetName)) {
      var config = sourceSheets[sheetName];
      
      try {
        Validators_validatePushDataConfig(config, 'sourceSheets.' + sheetName);
        
        // Validate that target spreadsheets exist
        config.targets.forEach(function(target, index) {
          try {
            SheetService_getSpreadsheetMetadata(target.spreadsheetId);
          } catch (error) {
            throw ErrorHandler_createError(
              'Target spreadsheet not accessible: ' + target.spreadsheetId,
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
        throw ErrorHandler_createError(
          'Push configuration validation failed for sheet: ' + sheetName,
          ERROR_CODES.MISSING_PARAMETERS,
          { 
            sourceSheet: sheetName,
            config: config,
            originalError: error.message
          }
        );
      }
    }
  }
  
  // Validate that all source sheets exist in the main spreadsheet
  var requiredSourceSheets = Object.keys(sourceSheets);
  SheetService_validateRequiredSheets(
    CONFIG.SPREADSHEETS.MAIN,
    requiredSourceSheets,
    'Push data validation'
  );
  
  AppLogger_info('Push data configurations validated successfully', {
    sourceSheetCount: requiredSourceSheets.length,
    sourceSheets: requiredSourceSheets
  });
}

/**
 * Gets push data status for all configured sheets
 * @returns {Object} Status information for push data configurations
 */
function DataPusher_getPushDataStatus() {
  try {
    var status = {
      timestamp: DateUtils_getCurrentTimestamp(),
      sourceSheets: []
    };
    
    var sourceSheets = CONFIG.PUSH_DATA_CONFIGS.sourceSheets;
    
    for (var sheetName in sourceSheets) {
      if (sourceSheets.hasOwnProperty(sheetName)) {
        var config = sourceSheets[sheetName];
        
        try {
          // Read current data from source
          var sourceData = SheetService_readSheetData(
            CONFIG.SPREADSHEETS.MAIN,
            sheetName,
            config.range,
            'getPushDataStatus'
          );
          
          var sheetStatus = {
            sheetName: sheetName,
            range: config.range,
            currentRowCount: sourceData.length,
            currentColumnCount: sourceData.length > 0 ? sourceData[0].length : 0,
            targetCount: config.targets.length,
            targets: []
          };
          
          // Check each target
          config.targets.forEach(function(target, index) {
            try {
              var targetMetadata = SheetService_getSpreadsheetMetadata(target.spreadsheetId);
              sheetStatus.targets.push({
                index: index,
                spreadsheetId: target.spreadsheetId,
                sheetName: target.sheetName,
                accessible: true,
                spreadsheetName: targetMetadata.name
              });
            } catch (error) {
              sheetStatus.targets.push({
                index: index,
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
            sheetName: sheetName,
            error: error.message
          });
        }
      }
    }
    
    return status;
    
  } catch (error) {
    AppLogger_error('Failed to get push data status', error);
    throw error;
  }
}

/**
 * Pushes data from a specific source sheet (for individual testing)
 * @param {string} sourceSheetName - The name of the source sheet to push
 * @returns {Object} Push result
 * @throws {Error} If push operation fails
 */
function DataPusher_pushSpecificSheet(sourceSheetName) {
  try {
    AppLogger_operationStart('pushSpecificSheet', { sourceSheetName: sourceSheetName });
    
    var config = CONFIG.PUSH_DATA_CONFIGS.sourceSheets[sourceSheetName];
    
    if (!config) {
      throw ErrorHandler_createError(
        'No configuration found for source sheet: ' + sourceSheetName,
        ERROR_CODES.MISSING_PARAMETERS,
        { 
          sourceSheetName: sourceSheetName,
          availableSheets: Object.keys(CONFIG.PUSH_DATA_CONFIGS.sourceSheets)
        }
      );
    }
    
    var result = DataPusher_pushSingleSheet(sourceSheetName, config, 'pushSpecificSheet_' + sourceSheetName);
    
    AppLogger_operationSuccess('pushSpecificSheet', result);
    return result;
    
  } catch (error) {
    AppLogger_operationFailure('pushSpecificSheet', error, { sourceSheetName: sourceSheetName });
    throw error;
  }
}

/**
 * Creates the success dialog HTML content
 * @returns {string} HTML content for the success dialog
 */
function DataPusher_createSuccessDialogContent() {
  var links = CONFIG.SUCCESS_LINKS.map(function(link) {
    return '<li><a href="' + link.url + '" target="_blank">' + link.name + '</a></li>';
  }).join('');
  
  return '<div style="font-family: Arial, sans-serif; font-size: 14px;">' +
         '<p>Data was pushed successfully to the reports.</p>' +
         '<ul>' + links + '</ul>' +
         '</div>';
}

/**
 * DataPusher object for backward compatibility and easier access
 */
var DataPusher = {
  pushAllData: DataPusher_pushAllData,
  pushSingleSheet: DataPusher_pushSingleSheet,
  getPushDataStatus: DataPusher_getPushDataStatus,
  pushSpecificSheet: DataPusher_pushSpecificSheet,
  createSuccessDialogContent: DataPusher_createSuccessDialogContent,
  _pushToTarget: DataPusher__pushToTarget,
  _validatePushConfigurations: DataPusher__validatePushConfigurations
};
