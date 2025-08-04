/**
 * @fileoverview Email Service for NISD API Project
 * @description Email service for handling Gmail operations in the NISD API project.
 * Provides methods for retrieving emails, attachments, and managing Gmail labels.
 * Compatible with Google Apps Script V8 runtime.
 * @author Alvaro Gomez, Academic Technology Coach
 * @version 2.0.0
 * @since 2025-08-04
 */

/**
 * @function EmailService_getLatestEmailByLabel
 * @description Retrieves the latest email from a specific Gmail label
 * @param {string} labelName - The Gmail label to search for
 * @returns {GoogleAppsScript.Gmail.GmailMessage} The latest email message
 * @throws {Error} If the label doesn't exist or no emails are found
 * @example
 * // Get latest email from a specific label
 * var email = EmailService_getLatestEmailByLabel('Reports/Daily');
 * console.log('Email subject: ' + email.getSubject());
 */
function EmailService_getLatestEmailByLabel(labelName) {
  var timer = AppLogger_startTimer('getLatestEmailByLabel_' + labelName);
  
  try {
    AppLogger_operationStart('getLatestEmailByLabel', { labelName: labelName });
    
    Validators_validateGmailLabel(labelName, 'getLatestEmailByLabel');
    
    var label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      throw ErrorHandler_createError(
        'Label "' + labelName + '" does not exist',
        ERROR_CODES.LABEL_NOT_FOUND,
        { labelName: labelName }
      );
    }
    
    var threads = label.getThreads(0, 1); // Get the most recent thread
    if (threads.length === 0) {
      throw ErrorHandler_createError(
        'No emails found under label "' + labelName + '"',
        ERROR_CODES.EMAIL_NOT_FOUND,
        { labelName: labelName }
      );
    }
    
    var messages = threads[0].getMessages();
    var latestMessage = messages[messages.length - 1];
    
    AppLogger_operationSuccess('getLatestEmailByLabel', { 
      labelName: labelName,
      messageCount: messages.length,
      messageSubject: latestMessage.getSubject(),
      messageDate: latestMessage.getDate()
    }, timer.stop());
    
    return latestMessage;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('getLatestEmailByLabel', error, { labelName: labelName });
    throw error;
  }
}

/**
 * @function EmailService_getExcelAttachment
 * @description Extracts an Excel attachment from an email message
 * @param {GoogleAppsScript.Gmail.GmailMessage} message - The email message
 * @param {string} [context] - Context for error messages
 * @returns {GoogleAppsScript.Base.Blob} The Excel attachment as a Blob
 * @throws {Error} If no Excel attachment is found
 * @example
 * var email = EmailService_getLatestEmailByLabel('Reports/Daily');
 * var attachment = EmailService_getExcelAttachment(email, 'Daily report processing');
 */
function EmailService_getExcelAttachment(message, context) {
  context = context || 'Email attachment extraction';
  var timer = AppLogger_startTimer('getExcelAttachment');
  
  try {
    AppLogger_operationStart('getExcelAttachment', { context: context });
    
    if (!message) {
      throw ErrorHandler_createError(
        'No email message provided',
        ERROR_CODES.MISSING_PARAMETERS
      );
    }
    
    var attachments = message.getAttachments();
    
    AppLogger_debug('Email attachment details', {
      attachmentCount: attachments.length,
      attachmentNames: attachments.map(function(att) { return att.getName(); }),
      attachmentTypes: attachments.map(function(att) { return att.getContentType(); })
    });
    
    if (attachments.length === 0) {
      throw ErrorHandler_createError(
        'No attachments found in the email',
        ERROR_CODES.ATTACHMENT_NOT_FOUND,
        { 
          messageSubject: message.getSubject(),
          messageDate: message.getDate()
        }
      );
    }
    
    var excelAttachment = null;
    for (var i = 0; i < attachments.length; i++) {
      if (attachments[i].getContentType() === MIME_TYPES.EXCEL) {
        excelAttachment = attachments[i];
        break;
      }
    }
    
    if (!excelAttachment) {
      throw ErrorHandler_createError(
        'No Excel attachment found in the email',
        ERROR_CODES.ATTACHMENT_NOT_FOUND,
        {
          attachmentTypes: attachments.map(function(att) { return att.getContentType(); }),
          expectedType: MIME_TYPES.EXCEL,
          messageSubject: message.getSubject()
        }
      );
    }
    
    // Validate the attachment
    Validators_validateEmailAttachment(excelAttachment, context);
    
    AppLogger_operationSuccess('getExcelAttachment', {
      fileName: excelAttachment.getName(),
      fileSize: excelAttachment.getSize(),
      contentType: excelAttachment.getContentType()
    }, timer.stop());
    
    return excelAttachment;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('getExcelAttachment', error, { context: context });
    throw error;
  }
}

/**
 * Retrieves all available Gmail labels
 * @returns {Array<string>} Array of label names
 */
function EmailService_getAllLabels() {
  var timer = AppLogger_startTimer('getAllLabels');
  
  try {
    AppLogger_operationStart('getAllLabels');
    
    var labels = GmailApp.getUserLabels();
    var labelNames = labels.map(function(label) { return label.getName(); });
    
    AppLogger_operationSuccess('getAllLabels', {
      labelCount: labelNames.length
    }, timer.stop());
    
    return labelNames;
    
  } catch (error) {
    timer.stop();
    AppLogger_operationFailure('getAllLabels', error);
    throw error;
  }
}

/**
 * Checks if a Gmail label exists
 * @param {string} labelName - The label name to check
 * @returns {boolean} True if the label exists
 */
function EmailService_labelExists(labelName) {
  try {
    Validators_validateGmailLabel(labelName, 'labelExists');
    
    var label = GmailApp.getUserLabelByName(labelName);
    return label !== null;
    
  } catch (error) {
    AppLogger_error('Error checking if label exists', error, { labelName: labelName });
    return false;
  }
}

/**
 * Gets email count for a specific label
 * @param {string} labelName - The Gmail label to check
 * @returns {number} Number of emails with the label
 */
function EmailService_getEmailCountByLabel(labelName) {
  try {
    Validators_validateGmailLabel(labelName, 'getEmailCountByLabel');
    
    var label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      return 0;
    }
    
    var threads = label.getThreads();
    var messageCount = threads.reduce(function(count, thread) {
      return count + thread.getMessageCount();
    }, 0);
    
    AppLogger_debug('Email count retrieved', { labelName: labelName, messageCount: messageCount });
    
    return messageCount;
    
  } catch (error) {
    AppLogger_error('Error getting email count', error, { labelName: labelName });
    return 0;
  }
}

/**
 * Gets the latest email date for a specific label
 * @param {string} labelName - The Gmail label to check
 * @returns {Date|null} Date of the latest email or null if no emails found
 */
function EmailService_getLatestEmailDate(labelName) {
  try {
    var message = EmailService_getLatestEmailByLabel(labelName);
    return message.getDate();
  } catch (error) {
    AppLogger_warn('Could not get latest email date', { labelName: labelName, error: error.message });
    return null;
  }
}

/**
 * Validates email configuration and checks label existence
 * @param {Object} emailConfig - The email configuration to validate
 * @throws {Error} If the configuration is invalid or label doesn't exist
 */
function EmailService_validateEmailConfigWithGmail(emailConfig) {
  // First validate the structure
  Validators_validateEmailConfig(emailConfig, 'validateEmailConfigWithGmail');
  
  // Then check if the label actually exists in Gmail
  if (!EmailService_labelExists(emailConfig.label)) {
    throw ErrorHandler_createError(
      'Gmail label "' + emailConfig.label + '" does not exist',
      ERROR_CODES.LABEL_NOT_FOUND,
      { labelName: emailConfig.label }
    );
  }
  
  AppLogger_info('Email configuration validated', { 
    labelName: emailConfig.label,
    sheetName: emailConfig.sheetName
  });
}

/**
 * EmailService object for backward compatibility and easier access
 */
var EmailService = {
  getLatestEmailByLabel: EmailService_getLatestEmailByLabel,
  getExcelAttachment: EmailService_getExcelAttachment,
  getAllLabels: EmailService_getAllLabels,
  labelExists: EmailService_labelExists,
  getEmailCountByLabel: EmailService_getEmailCountByLabel,
  getLatestEmailDate: EmailService_getLatestEmailDate,
  validateEmailConfigWithGmail: EmailService_validateEmailConfigWithGmail
};
