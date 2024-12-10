/**
 * This project supports a Google spreadsheet that simulates an API. The spreadsheet contains
 * multiple sheets that feed information to separate projects. The spreadsheet is meant
 * to make data gathering more time efficient. Three of the sheets have to be manually
 * updated (Alt_HS_Attendance_Enrollment_Count, Entry_Withdrawal, and Allergies) on this
 * project's spreadsheet, but another three (Schedules, ContactInfo, and Entry_Withdrawal2)
 * are automatically updated using report subscriptions from Cognos and triggers that call
 * updateSheetsFromEmail(). The three subscribed Cognos reports are sent to Alvaro Gomez's gmail
 * from Cognos programatically and are automatically labeled using Gmail's labeling rules
 * service.
 * 
 * The function below updates the sheets using the data from the emails' attached Excel files.
 * The emails are identified using specific Gmail labels. Each label corresponds
 * to a specific sheet within the target spreadsheet.
 * 
 * This script uses the Google Drive API service to process the Excel file attachments.
 * 
 * Five (one for each day of the week) time-based triggers are configured to run this function
 * every weekday at 5:00 AM after the emails have been received from Cognos which are scheduled
 * between 4:00 - 4:03 AM each weekday.
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
 * This function is called by updateSheetsFromEmail, it processes the most recent
 * email with the configured Gmail label and updates the target sheet's data range with
 * the data provided in the sheet.
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
 * Is called by processEmailToSheet and processes an Excel file attachment which extracts
 * its data as a 2D array. The first row (header) is excluded from the returned data.
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
  const spreadsheetId = sheetFile.id;

  // Add a retry mechanism to handle backend propagation delay
  const maxRetries = 5;
  const retryDelay = 1000; // 1 second
  let retryCount = 0;
  let spreadsheet;

  while (retryCount < maxRetries) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      break; // Exit loop if successful
    } catch (e) {
      retryCount++;
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to open the Google Sheet after ${maxRetries} retries. Error: ${e.message}`);
      }
      Utilities.sleep(retryDelay); // Wait before retrying
    }
  }

  // Open the first sheet and get its data as a 2D array
  const sheet = spreadsheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  // Exclude the header row (first row)
  const dataWithoutHeader = data.slice(1);

  // Delete the temporary files from Google Drive
  try {
    Utilities.sleep(2000); // Wait 2 seconds before deletion
    file.setTrashed(true); // Move the original file to trash
    Drive.Files.remove(spreadsheetId); // Attempt to delete the converted file
    Logger.log(`File cleanup completed successfully.`);
  } catch (error) {
    Logger.log(`Error during file cleanup: ${error.message}`);
    // Optionally notify or log the error without breaking the script flow
  }

  return dataWithoutHeader; // Return the extracted data
}
