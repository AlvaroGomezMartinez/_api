/**
 * Date and time utilities for the NISD API project.
 * Provides consistent date formatting and timezone handling.
 * 
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Date utility functions
 */
class DateUtils {
  
  /**
   * Formats a date according to the application's standard format
   * @param {Date} date - The date to format
   * @param {string} format - Optional format string (defaults to CONFIG.SETTINGS.dateFormat)
   * @param {string} timezone - Optional timezone (defaults to CONFIG.SETTINGS.timezone)
   * @returns {string} Formatted date string
   */
  static formatDate(date = new Date(), format = CONFIG.SETTINGS.dateFormat, timezone = CONFIG.SETTINGS.timezone) {
    try {
      return Utilities.formatDate(date, timezone, format);
    } catch (error) {
      AppLogger.error('Error formatting date', error, { date, format, timezone });
      return date.toString();
    }
  }
  
  /**
   * Gets the current timestamp in ISO format
   * @returns {string} ISO timestamp string
   */
  static getCurrentTimestamp() {
    return new Date().toISOString();
  }
  
  /**
   * Gets the current date formatted for display
   * @returns {string} Formatted current date
   */
  static getCurrentDateFormatted() {
    return this.formatDate();
  }
  
  /**
   * Creates a timestamp note for spreadsheet cells
   * @param {string} action - The action that was performed
   * @param {Date} date - Optional date (defaults to current date)
   * @returns {string} Formatted timestamp note
   */
  static createTimestampNote(action = 'Updated', date = new Date()) {
    const formattedDate = this.formatDate(date);
    return `${action} on: ${formattedDate}`;
  }
  
  /**
   * Creates a timestamp note for script updates
   * @param {Date} date - Optional date (defaults to current date)
   * @returns {string} Formatted script timestamp note
   */
  static createScriptTimestampNote(date = new Date()) {
    const formattedDate = this.formatDate(date);
    return `${formattedDate} by script`;
  }
  
  /**
   * Parses a date string into a Date object
   * @param {string} dateString - The date string to parse
   * @param {string} timezone - Optional timezone
   * @returns {Date|null} Parsed date or null if parsing fails
   */
  static parseDate(dateString, timezone = CONFIG.SETTINGS.timezone) {
    try {
      // Handle various date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date string');
      }
      return date;
    } catch (error) {
      AppLogger.error('Error parsing date', error, { dateString, timezone });
      return null;
    }
  }
  
  /**
   * Checks if a date is within a specified range
   * @param {Date} date - The date to check
   * @param {Date} startDate - Range start date
   * @param {Date} endDate - Range end date
   * @returns {boolean} True if date is within range
   */
  static isDateInRange(date, startDate, endDate) {
    return date >= startDate && date <= endDate;
  }
  
  /**
   * Gets the start of the current day
   * @param {string} timezone - Optional timezone
   * @returns {Date} Start of current day
   */
  static getStartOfDay(timezone = CONFIG.SETTINGS.timezone) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return startOfDay;
  }
  
  /**
   * Gets the end of the current day
   * @param {string} timezone - Optional timezone
   * @returns {Date} End of current day
   */
  static getEndOfDay(timezone = CONFIG.SETTINGS.timezone) {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return endOfDay;
  }
  
  /**
   * Adds days to a date
   * @param {Date} date - Base date
   * @param {number} days - Number of days to add (can be negative)
   * @returns {Date} New date with days added
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  /**
   * Gets a human-readable time difference
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date (defaults to now)
   * @returns {string} Human-readable time difference
   */
  static getTimeDifference(date1, date2 = new Date()) {
    const diffMs = Math.abs(date2 - date1);
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} ago`;
  }
  
  /**
   * Validates if a string represents a valid date
   * @param {string} dateString - The date string to validate
   * @returns {boolean} True if valid date string
   */
  static isValidDateString(dateString) {
    const date = this.parseDate(dateString);
    return date !== null && !isNaN(date.getTime());
  }
}
