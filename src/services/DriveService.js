/**
 * Google Drive service for handling file operations in the NISD API project.
 * Provides methods for processing Excel files and managing temporary files.
 * Compatible with Google Apps Script V8 runtime.
 *
 * @file Drive service for NISD API project.
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Processes an Excel file attachment and extracts its data as a 2D array.
 * @param {GoogleAppsScript.Base.Blob} fileBlob - The Excel file attachment as a Blob.
 * @param {string} [context] - Context for error messages.
 * @returns {Array<Array<string>>} The extracted data from the Excel file, excluding the header row.
 * @throws {Error} If the file cannot be processed or converted.
 */
function DriveService_processExcelData(fileBlob, context) {
  context = context || 'Excel data processing';
  var timer = AppLogger_startTimer('processExcelData');
  var tempFile = null;
  var convertedFile = null;
  
  try {
    AppLogger_operationStart('processExcelData', { 
      context: context,
      fileName: fileBlob.getName(),
      fileSize: fileBlob.getSize()
    });
    
    // Validate input
    if (!fileBlob) {
      throw ErrorHandler_createError(
        'No file blob provided',
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    // Step 1: Save the Excel file to Google Drive temporarily
    tempFile = DriveService__createTempFile(fileBlob);
    AppLogger_debug('Temporary file created', {
      fileId: tempFile.getId(),
      fileName: tempFile.getName()
    });
    
    // Step 2: Convert to Google Sheets format
    convertedFile = DriveService__convertToGoogleSheets(tempFile);
    AppLogger_debug('File converted to Google Sheets', {
      convertedFileId: convertedFile.id
    });
    
    // Step 3: Extract data with retry mechanism
    var data = ErrorHandler_withRetry(
      function() { return DriveService__extractDataFromSheet(convertedFile.id); },
      CONFIG.RETRY_CONFIG.maxRetries,
      CONFIG.RETRY_CONFIG.retryDelay,
      'Extract data from converted sheet'
    );
    
    AppLogger_dataProcessing('Excel data extracted', data.length, {
      columns: data.length > 0 ? data[0].length : 0,
      fileName: fileBlob.getName()
    });
    
    AppLogger_operationSuccess('processExcelData', {
      rowCount: data.length,
      columnCount: data.length > 0 ? data[0].length : 0
    }, timer.stop());
    
    return data;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('processExcelData', error, { context: context });
    throw error;
  } finally {
    // Clean up temporary files
    DriveService__cleanupTempFiles([tempFile, convertedFile]);
  }
}

/**
 * Creates a temporary file in Google Drive.
 * @private
 * @param {GoogleAppsScript.Base.Blob} fileBlob - The file blob to save.
 * @returns {GoogleAppsScript.Drive.File} The created temporary file.
 * @throws {Error} If file creation fails.
 */
function DriveService__createTempFile(fileBlob) {
  try {
    var file = DriveApp.createFile(fileBlob);
    
    // Add metadata to identify as temporary
    var timestamp = DateUtils_getCurrentTimestamp();
    file.setDescription('Temporary file created by NISD API script at ' + timestamp);
    
    return file;
  } catch (error) {
    throw ErrorHandler_createError(
      'Failed to create temporary file in Google Drive',
      ERROR_CODES.FILE_PROCESSING_ERROR,
      { originalError: error.message }
    );
  }
}

/**
 * Converts a file to Google Sheets format using the Drive API.
 * @private
 * @param {GoogleAppsScript.Drive.File} file - The file to convert.
 * @returns {Object} The converted file metadata.
 * @throws {Error} If conversion fails.
 */
function DriveService__convertToGoogleSheets(file) {
  try {
    var resource = {
      title: file.getName() + '_converted',
      mimeType: MIME_TYPES.GOOGLE_SHEETS
    };
    
    // Use the Advanced Drive Service to convert the file
    var convertedFile = Drive.Files.create(resource, file.getBlob());
    
    AppLogger_debug('File conversion completed', {
      originalFileId: file.getId(),
      convertedFileId: convertedFile.id,
      originalMimeType: file.getBlob().getContentType(),
      convertedMimeType: MIME_TYPES.GOOGLE_SHEETS
    });
    
    return convertedFile;
  } catch (error) {
    throw ErrorHandler_createError(
      'Failed to convert file to Google Sheets format',
      ERROR_CODES.FILE_PROCESSING_ERROR,
      { 
        fileId: file.getId(),
        fileName: file.getName(),
        originalError: error.message 
      }
    );
  }
}

/**
 * Extracts data from a Google Sheets file.
 * @private
 * @param {string} spreadsheetId - The ID of the Google Sheets file.
 * @returns {Array<Array<string>>} The extracted data without headers.
 * @throws {Error} If data extraction fails.
 */
function DriveService__extractDataFromSheet(spreadsheetId) {
  try {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheets()[0]; // Get the first sheet
    
    if (!sheet) {
      throw ErrorHandler_createError(
        'No sheets found in the converted file',
        ERROR_CODES.SHEET_NOT_FOUND,
        { spreadsheetId: spreadsheetId }
      );
    }
    
    var dataRange = sheet.getDataRange();
    if (!dataRange) {
      AppLogger_warn('No data range found in sheet', { spreadsheetId: spreadsheetId });
      return [];
    }
    
    var data = dataRange.getValues();
    
    // Exclude the header row (first row) if data exists
    var dataWithoutHeader = data.length > 1 ? data.slice(1) : [];
    
    AppLogger_debug('Data extracted from sheet', {
      totalRows: data.length,
      dataRows: dataWithoutHeader.length,
      columns: data.length > 0 ? data[0].length : 0
    });
    
    return dataWithoutHeader;
  } catch (error) {
    if (error.message && error.message.indexOf('not found') !== -1) {
      throw ErrorHandler_createError(
        'Converted spreadsheet not found or not accessible',
        ERROR_CODES.SPREADSHEET_NOT_FOUND,
        { spreadsheetId: spreadsheetId }
      );
    }
    throw error;
  }
}

/**
 * Cleans up temporary files from Google Drive.
 * @private
 * @param {Array} files - Array of file objects to clean up (can include nulls).
 * @returns {void}
 */
function DriveService__cleanupTempFiles(files) {
  if (!files || files.length === 0) {
    return;
  }
  
  var cleanupDelay = CONFIG.RETRY_CONFIG.fileCleanupDelay;
  
  // Wait before cleanup to ensure files are not in use
  if (cleanupDelay > 0) {
    Utilities.sleep(cleanupDelay);
  }
  
  files.forEach(function(file, index) {
    if (!file) return;
    
    try {
      // Handle different file object types
      if (file.setTrashed && typeof file.setTrashed === 'function') {
        // Google Apps Script Drive File object
        file.setTrashed(true);
        AppLogger_debug('Temporary file moved to trash', {
          fileId: file.getId ? file.getId() : 'unknown',
          fileName: file.getName ? file.getName() : 'unknown'
        });
      } else if (file.id) {
        // Drive API file object
        Drive.Files.remove(file.id);
        AppLogger_debug('Temporary file deleted', {
          fileId: file.id
        });
      }
    } catch (error) {
      AppLogger_warn('Failed to cleanup temporary file', {
        fileIndex: index,
        error: error.message,
        fileId: file.id || (file.getId ? file.getId() : 'unknown')
      });
    }
  });
  
  AppLogger_info('Temporary file cleanup completed', {
    fileCount: files.filter(function(f) { return f !== null; }).length
  });
}

/**
 * Gets file metadata from Google Drive.
 * @param {string} fileId - The ID of the file.
 * @returns {Object} File metadata.
 * @throws {Error} If file is not found or not accessible.
 */
function DriveService_getFileMetadata(fileId) {
  try {
    Validators_validateSpreadsheetId(fileId, 'File ID');
    
    var file = DriveApp.getFileById(fileId);
    
    return {
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getBlob().getContentType(),
      size: file.getSize(),
      dateCreated: file.getDateCreated(),
      lastUpdated: file.getLastUpdated(),
      owner: file.getOwner().getEmail()
    };
  } catch (error) {
    throw ErrorHandler_createError(
      'Failed to get file metadata',
      ERROR_CODES.FILE_PROCESSING_ERROR,
      { fileId: fileId, originalError: error.message }
    );
  }
}

/**
 * Validates that a file exists and is accessible.
 * @param {string} fileId - The ID of the file to validate.
 * @param {string} [context] - Context for error messages.
 * @throws {Error} If file is not found or not accessible.
 * @returns {void}
 */
function DriveService_validateFileExists(fileId, context) {
  context = context || 'File validation';
  
  try {
    DriveApp.getFileById(fileId);
  } catch (error) {
    throw ErrorHandler_createError(
      context + ': File not found or not accessible',
      ERROR_CODES.FILE_PROCESSING_ERROR,
      { fileId: fileId, originalError: error.message }
    );
  }
}

/**
 * DriveService object for backward compatibility and easier access.
 * @namespace DriveService
 */
var DriveService = {
  processExcelData: DriveService_processExcelData,
  getFileMetadata: DriveService_getFileMetadata,
  validateFileExists: DriveService_validateFileExists,
  _createTempFile: DriveService__createTempFile,
  _convertToGoogleSheets: DriveService__convertToGoogleSheets,
  _extractDataFromSheet: DriveService__extractDataFromSheet,
  _cleanupTempFiles: DriveService__cleanupTempFiles
};
