/**
 * Email service for handling Gmail operations in the NISD API project.
 * Provides methods for retrieving emails, attachments, and managing Gmail labels.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Gmail service class for email operations
 */
class EmailService {
  
  /**
   * Retrieves the latest email from a specific Gmail label
   * @param {string} labelName - The Gmail label to search for
   * @returns {GoogleAppsScript.Gmail.GmailMessage} The latest email message
   * @throws {Error} If the label doesn't exist or no emails are found
   */
  static getLatestEmailByLabel(labelName) {
    const timer = AppLogger.startTimer(`getLatestEmailByLabel_${labelName}`);
    
    try {
      AppLogger.operationStart('getLatestEmailByLabel', { labelName });
      
      Validators.validateGmailLabel(labelName, 'getLatestEmailByLabel');
      
      const label = GmailApp.getUserLabelByName(labelName);
      if (!label) {
        throw ErrorHandler.createError(
          `Label "${labelName}" does not exist`,
          ERROR_CODES.LABEL_NOT_FOUND,
          { labelName }
        );
      }
      
      const threads = label.getThreads(0, 1); // Get the most recent thread
      if (threads.length === 0) {
        throw ErrorHandler.createError(
          `No emails found under label "${labelName}"`,
          ERROR_CODES.EMAIL_NOT_FOUND,
          { labelName }
        );
      }
      
      const messages = threads[0].getMessages();
      const latestMessage = messages[messages.length - 1];
      
      AppLogger.operationSuccess('getLatestEmailByLabel', { 
        labelName,
        messageCount: messages.length,
        messageSubject: latestMessage.getSubject(),
        messageDate: latestMessage.getDate()
      }, timer.stop());
      
      return latestMessage;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('getLatestEmailByLabel', error, { labelName });
      throw error;
    }
  }
  
  /**
   * Extracts an Excel attachment from an email message
   * @param {GoogleAppsScript.Gmail.GmailMessage} message - The email message
   * @param {string} context - Context for error messages
   * @returns {GoogleAppsScript.Base.Blob} The Excel attachment as a Blob
   * @throws {Error} If no Excel attachment is found
   */
  static getExcelAttachment(message, context = 'Email attachment extraction') {
    const timer = AppLogger.startTimer('getExcelAttachment');
    
    try {
      AppLogger.operationStart('getExcelAttachment', { context });
      
      if (!message) {
        throw ErrorHandler.createError(
          'No email message provided',
          ERROR_CODES.MISSING_PARAMETERS
        );
      }
      
      const attachments = message.getAttachments();
      
      AppLogger.debug('Email attachment details', {
        attachmentCount: attachments.length,
        attachmentNames: attachments.map(att => att.getName()),
        attachmentTypes: attachments.map(att => att.getContentType())
      });
      
      if (attachments.length === 0) {
        throw ErrorHandler.createError(
          'No attachments found in the email',
          ERROR_CODES.ATTACHMENT_NOT_FOUND,
          { 
            messageSubject: message.getSubject(),
            messageDate: message.getDate()
          }
        );
      }
      
      const excelAttachment = attachments.find(att => 
        att.getContentType() === MIME_TYPES.EXCEL
      );
      
      if (!excelAttachment) {
        throw ErrorHandler.createError(
          'No Excel attachment found in the email',
          ERROR_CODES.ATTACHMENT_NOT_FOUND,
          {
            attachmentTypes: attachments.map(att => att.getContentType()),
            expectedType: MIME_TYPES.EXCEL,
            messageSubject: message.getSubject()
          }
        );
      }
      
      // Validate the attachment
      Validators.validateEmailAttachment(excelAttachment, context);
      
      AppLogger.operationSuccess('getExcelAttachment', {
        fileName: excelAttachment.getName(),
        fileSize: excelAttachment.getSize(),
        contentType: excelAttachment.getContentType()
      }, timer.stop());
      
      return excelAttachment;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('getExcelAttachment', error, { context });
      throw error;
    }
  }
  
  /**
   * Retrieves all available Gmail labels
   * @returns {Array<string>} Array of label names
   */
  static getAllLabels() {
    const timer = AppLogger.startTimer('getAllLabels');
    
    try {
      AppLogger.operationStart('getAllLabels');
      
      const labels = GmailApp.getUserLabels();
      const labelNames = labels.map(label => label.getName());
      
      AppLogger.operationSuccess('getAllLabels', {
        labelCount: labelNames.length
      }, timer.stop());
      
      return labelNames;
      
    } catch (error) {
      timer.stop();
      AppLogger.operationFailure('getAllLabels', error);
      throw error;
    }
  }
  
  /**
   * Checks if a Gmail label exists
   * @param {string} labelName - The label name to check
   * @returns {boolean} True if the label exists
   */
  static labelExists(labelName) {
    try {
      Validators.validateGmailLabel(labelName, 'labelExists');
      
      const label = GmailApp.getUserLabelByName(labelName);
      return label !== null;
      
    } catch (error) {
      AppLogger.error('Error checking if label exists', error, { labelName });
      return false;
    }
  }
  
  /**
   * Gets email count for a specific label
   * @param {string} labelName - The Gmail label to check
   * @returns {number} Number of emails with the label
   */
  static getEmailCountByLabel(labelName) {
    try {
      Validators.validateGmailLabel(labelName, 'getEmailCountByLabel');
      
      const label = GmailApp.getUserLabelByName(labelName);
      if (!label) {
        return 0;
      }
      
      const threads = label.getThreads();
      const messageCount = threads.reduce((count, thread) => {
        return count + thread.getMessageCount();
      }, 0);
      
      AppLogger.debug('Email count retrieved', { labelName, messageCount });
      
      return messageCount;
      
    } catch (error) {
      AppLogger.error('Error getting email count', error, { labelName });
      return 0;
    }
  }
  
  /**
   * Gets the latest email date for a specific label
   * @param {string} labelName - The Gmail label to check
   * @returns {Date|null} Date of the latest email or null if no emails found
   */
  static getLatestEmailDate(labelName) {
    try {
      const message = this.getLatestEmailByLabel(labelName);
      return message.getDate();
    } catch (error) {
      AppLogger.warn('Could not get latest email date', { labelName, error: error.message });
      return null;
    }
  }
  
  /**
   * Validates email configuration and checks label existence
   * @param {Object} emailConfig - The email configuration to validate
   * @throws {Error} If the configuration is invalid or label doesn't exist
   */
  static validateEmailConfigWithGmail(emailConfig) {
    // First validate the structure
    Validators.validateEmailConfig(emailConfig, 'validateEmailConfigWithGmail');
    
    // Then check if the label actually exists in Gmail
    if (!this.labelExists(emailConfig.label)) {
      throw ErrorHandler.createError(
        `Gmail label "${emailConfig.label}" does not exist`,
        ERROR_CODES.LABEL_NOT_FOUND,
        { labelName: emailConfig.label }
      );
    }
    
    AppLogger.info('Email configuration validated', { 
      labelName: emailConfig.label,
      sheetName: emailConfig.sheetName
    });
  }
}
