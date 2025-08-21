/**
 * Legacy utility functions for the NISD API project.
 * This file has been refactored - functionality moved to src/utils/Utils.js
 * 
 * @deprecated Use Utils.listGmailLabels() instead
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Legacy function for getting Gmail labels.
 * Utility formula previously used to get the list of Gmail labels for the main function.
 *
 * @deprecated Use Utils.listGmailLabels() instead.
 * @function
 * @returns {string[]} Array of Gmail label names.
 */
function listGmailLabels() {
  try {
    AppLogger.warn('Using deprecated listGmailLabels function. Use Utils.listGmailLabels() instead.');
    
    // Delegate to the new Utils class
    return Utils.listGmailLabels();
    
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'listGmailLabels (legacy)');
    throw error;
  }
}
