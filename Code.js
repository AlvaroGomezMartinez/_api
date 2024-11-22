/**
 * This project supports a Google spreadsheet that simulates an API. The spreadsheet contains
 * multiple sheets that feed information to separate projects. The spredsheet is meant
 * to make data gathering more time efficient. Three of the sheets have to be manually
 * updated, but another three can be automated using report subscriptions from Cognos.
 * The three subscribed reports are sent to Alvaro Gomez's gmail and are labeled.
 * 
 * The function below updates the sheets using the data from attached Excel files.
 * The emails are identified using specific Gmail labels. Each label corresponds
 * to a specific sheet within the target spreadsheet.
 * 
 * This script uses the Google Drive API service to proocess the Excel file attachments.
 * A time-based trigger is configured to run this function every weekday at 5:00 AM
 * after the emails have been received from Cognos from 4:00 - 4:03 AM each weekday.
 * 
 * Author: Alvaro Gomez, Academic Technology Coach
 * Office Phone: 1-210-397-9408
 * Cell Phone: 1-210-363-1577
 */
function updateSheetsFromEmail() {
  const spreadsheetId = "1uCQ_Z4QLbHq89tutZ4Wen0TREwS8qEx2j7MmzUgXOaY"; // The spreadsheet that contains all of the sheets

  // Configuration for Gmail labels and target sheets
  const configs = [
    {
      label: "Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Project Schedules",
      sheetName: "Schedules",
      rangeToClear: "A2:O"
    },
    {
      label: "Campuses/NAHS/Transition Information Workflow Project/Transition Information Workflow Project Contact Information",
      sheetName: "ContactInfo",
      rangeToClear: "A2:J"
    },
    {
      label: "Campuses/NAHS/Transition Information Workflow Project/Transition Informatin Workflow Entry_Withdrawal",
      sheetName: "Entry_Withdrawal2",
      rangeToClear: "A2:O"
    }
  ];

  try {
    configs.forEach(config => {
      processEmailToSheet(
        config.label,
        spreadsheetId,
        config.sheetName,
        config.rangeToClear
      );
    });

    Logger.log("All sheets updated successfully!");
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Processes the most recent email with the given Gmail label and updates the target sheet.
 *
 * @param {string} labelName - The Gmail label to search for.
 * @param {string} spreadsheetId - The ID of the target Google Spreadsheet.
 * @param {string} sheetName - The name of the sheet to update within the spreadsheet.
 * @param {string} rangeToClear - The range to clear before inserting new data (e.g., "A2:O").
 * @throws {Error} If the label, attachment, or sheet does not exist.
 */
function processEmailToSheet(labelName, spreadsheetId, sheetName, rangeToClear) {
  const label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    throw new Error(`Label "${labelName}" does not exist.`);
  }

  const threads = label.getThreads(0, 1); // Get the most recent thread
  if (threads.length === 0) {
    throw new Error(`No emails found under the label "${labelName}".`);
  }
  const messages = threads[0].getMessages();
  const latestMessage = messages[messages.length - 1];

  // Get the Excel Data attachment from the email
  const attachments = latestMessage.getAttachments();
  if (attachments.length === 0) {
    throw new Error(`No attachments found in the most recent email with label "${labelName}".`);
  }

  Logger.log(`Processing email with label: ${labelName}`);
  Logger.log(`Attachment names: ${attachments.map(att => att.getName()).join(", ")}`);
  Logger.log(`Attachment content types: ${attachments.map(att => att.getContentType()).join(", ")}`);

  const excelAttachment = attachments.find(att => att.getContentType() === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  if (!excelAttachment) {
    throw new Error(`No Excel attachment found in the most recent email with label "${labelName}".`);
  }

  // Process the Excel file and extract data
  const data = processExcelData(excelAttachment);

  // Access the target Google Sheet and update the data
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet named "${sheetName}" does not exist.`);
  }

  sheet.getRange(rangeToClear).clearContent();

  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);

  const today = new Date();
  const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), "MM/dd/yyyy");
  sheet.getRange("A1").setNote(`Updated on: ${formattedDate}`);

  Logger.log(`Data inserted into sheet "${sheetName}" successfully!`);
}

/**
 * Processes an Excel file attachment and extracts its data as a 2D array.
 * The first row (header) is excluded from the returned data.
 *
 * @param {Blob} fileBlob - The Excel file attachment as a Blob object.
 * @returns {Array<Array<string>>} The extracted data from the Excel file, excluding the header row.
 * @throws {Error} If the file cannot be processed or converted to Google Sheets.
 */
function processExcelData(fileBlob) {
  // Save the file to Google Drive
  const file = DriveApp.createFile(fileBlob);

  // Convert the file to Google Sheets format
  const resource = {
    title: file.getName(),
    mimeType: MimeType.GOOGLE_SHEETS
  };

  // Use the Advanced Drive Service to insert the file
  const sheetFile = Drive.Files.create(resource, file.getBlob());
  const spreadsheet = SpreadsheetApp.openById(sheetFile.id);

  // Open the first sheet and get its data as a 2D array
  const sheet = spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  // Exclude the header row (first row)
  const dataWithoutHeader = data.slice(1);

  // Delete the temporary files from Google Drive
  file.setTrashed(true);
  Drive.Files.remove(sheetFile.id); // Advanced Service can delete directly

  return dataWithoutHeader; // Return the extracted data
}
