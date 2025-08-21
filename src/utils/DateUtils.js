/**
 * Date and time utilities for the NISD API project.
 * Provides consistent date formatting, parsing, and timezone handling.
 * Compatible with Google Apps Script V8 runtime.
 *
 * @file Date and time utilities for NISD API project.
 * @author Alvaro Gomez, Academic Technology Coach
 */

/**
 * Formats a date according to the application's standard format.
 * @param {Date} [date] - The date to format (defaults to now).
 * @param {string} [format] - Format string (defaults to CONFIG.SETTINGS.dateFormat).
 * @param {string} [timezone] - Timezone (defaults to CONFIG.SETTINGS.timezone).
 * @returns {string} Formatted date string.
 */
function DateUtils_formatDate(date, format, timezone) {
  date = date || new Date();
  format = format || CONFIG.SETTINGS.dateFormat;
  timezone = timezone || CONFIG.SETTINGS.timezone;
  
  try {
    return Utilities.formatDate(date, timezone, format);
  } catch (error) {
    AppLogger_error('Error formatting date', error, { date: date, format: format, timezone: timezone });
    return date.toString();
  }
}

/**
 * Gets the current timestamp in ISO format.
 * @returns {string} ISO timestamp string.
 */
function DateUtils_getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Gets the current date formatted for display.
 * @returns {string} Formatted current date string.
 */
function DateUtils_getCurrentDateFormatted() {
  return DateUtils_formatDate();
}

/**
 * Creates a timestamp note for spreadsheet cells.
 * @param {string} [action] - The action that was performed (default 'Updated').
 * @param {Date} [date] - Date of the action (defaults to now).
 * @returns {string} Formatted timestamp note.
 */
function DateUtils_createTimestampNote(action, date) {
  action = action || 'Updated';
  date = date || new Date();
  
  var formattedDate = DateUtils_formatDate(date);
  return action + ' on: ' + formattedDate;
}

/**
 * Creates a timestamp note for script updates.
 * @param {Date} [date] - Date of the update (defaults to now).
 * @returns {string} Formatted script timestamp note.
 */
function DateUtils_createScriptTimestampNote(date) {
  date = date || new Date();
  var formattedDate = DateUtils_formatDate(date);
  return formattedDate + ' by script';
}

/**
 * Parses a date string into a Date object.
 * @param {string} dateString - The date string to parse.
 * @param {string} [timezone] - Timezone to use (defaults to CONFIG.SETTINGS.timezone).
 * @returns {Date|null} Parsed date or null if parsing fails.
 */
function DateUtils_parseDate(dateString, timezone) {
  timezone = timezone || CONFIG.SETTINGS.timezone;
  
  try {
    // Handle various date formats
    var date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string');
    }
    return date;
  } catch (error) {
    AppLogger_error('Error parsing date', error, { dateString: dateString, timezone: timezone });
    return null;
  }
}

/**
 * Checks if a date is within a specified range.
 * @param {Date} date - The date to check.
 * @param {Date} startDate - Range start date.
 * @param {Date} endDate - Range end date.
 * @returns {boolean} True if date is within range.
 */
function DateUtils_isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

/**
 * Gets the start of the current day.
 * @param {string} [timezone] - Timezone (defaults to CONFIG.SETTINGS.timezone).
 * @returns {Date} Start of current day.
 */
function DateUtils_getStartOfDay(timezone) {
  timezone = timezone || CONFIG.SETTINGS.timezone;
  var now = new Date();
  var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return startOfDay;
}

/**
 * Gets the end of the current day.
 * @param {string} [timezone] - Timezone (defaults to CONFIG.SETTINGS.timezone).
 * @returns {Date} End of current day.
 */
function DateUtils_getEndOfDay(timezone) {
  timezone = timezone || CONFIG.SETTINGS.timezone;
  var now = new Date();
  var endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfDay;
}

/**
 * Adds days to a date.
 * @param {Date} date - Base date.
 * @param {number} days - Number of days to add (can be negative).
 * @returns {Date} New date with days added.
 */
function DateUtils_addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Gets a human-readable time difference.
 * @param {Date} date1 - First date.
 * @param {Date} [date2] - Second date (defaults to now).
 * @returns {string} Human-readable time difference.
 */
function DateUtils_getTimeDifference(date1, date2) {
  date2 = date2 || new Date();
  
  var diffMs = Math.abs(date2 - date1);
  var diffSeconds = Math.floor(diffMs / 1000);
  var diffMinutes = Math.floor(diffSeconds / 60);
  var diffHours = Math.floor(diffMinutes / 60);
  var diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
  if (diffHours > 0) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
  if (diffMinutes > 0) return diffMinutes + ' minute' + (diffMinutes > 1 ? 's' : '') + ' ago';
  return diffSeconds + ' second' + (diffSeconds > 1 ? 's' : '') + ' ago';
}

/**
 * Validates if a string represents a valid date.
 * @param {string} dateString - The date string to validate.
 * @returns {boolean} True if valid date string.
 */
function DateUtils_isValidDateString(dateString) {
  var date = DateUtils_parseDate(dateString);
  return date !== null && !isNaN(date.getTime());
}

/**
 * DateUtils object for backward compatibility and easier access.
 * @namespace DateUtils
 */
var DateUtils = {
  formatDate: DateUtils_formatDate,
  getCurrentTimestamp: DateUtils_getCurrentTimestamp,
  getCurrentDateFormatted: DateUtils_getCurrentDateFormatted,
  createTimestampNote: DateUtils_createTimestampNote,
  createScriptTimestampNote: DateUtils_createScriptTimestampNote,
  parseDate: DateUtils_parseDate,
  isDateInRange: DateUtils_isDateInRange,
  getStartOfDay: DateUtils_getStartOfDay,
  getEndOfDay: DateUtils_getEndOfDay,
  addDays: DateUtils_addDays,
  getTimeDifference: DateUtils_getTimeDifference,
  isValidDateString: DateUtils_isValidDateString
};
