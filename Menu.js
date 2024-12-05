function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚩 Push Data')
    .addItem('Push Data to Sheets', 'pushDataToSheets')
    .addToUi();
}

/**
 * Gets called when the user selects the 'Push Data to Sheets' item in the menu.
 * Pushes data from the current spreadsheet to specific sheets in two target spreadsheets
 * (NAHS Criteria Sheet and NAMS 2024-25 Criteria Sheet).
 */
function pushDataToSheets() {
  try {
    const currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    /** @type {Object.<string, any[][]>} - Mapping of sheet names to their data ranges */
    const sourceData = {
      "Alt_HS_Attendance_Enrollment_Count": currentSpreadsheet.getSheetByName("Alt_HS_Attendance_Enrollment_Count").getRange("A2:H").getValues(),
      "Entry_Withdrawal": currentSpreadsheet.getSheetByName("Entry_Withdrawal").getRange("A2:I").getValues(),
      "Allergies": currentSpreadsheet.getSheetByName("Allergies").getRange("A2:E").getValues(),
    };

    const targetSpreadsheet1 = SpreadsheetApp.openById("1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA");

    // Update Alt_HS_Attendance_Enrollment_Count in Target Spreadsheet 1
    updateTargetSheet(
      targetSpreadsheet1.getSheetByName("Alt_HS_Attendance_Enrollment_Count"),
      sourceData["Alt_HS_Attendance_Enrollment_Count"]
    );

    // Update Entry_Withdrawal in Target Spreadsheet 1
    updateTargetSheet(
      targetSpreadsheet1.getSheetByName("Entry_Withdrawal"),
      sourceData["Entry_Withdrawal"]
    );

    const targetSpreadsheet2 = SpreadsheetApp.openById("1O3DSgTbhphNVDXLmlGkEiyVejsL_l4fPsf2cJJpQpTo");

    // Update Allergies in Target Spreadsheet 2
    updateTargetSheet(
      targetSpreadsheet2.getSheetByName("Allergies"),
      sourceData["Allergies"]
    );

    // Show custom dialog box with success message and links
    showSuccessDialog();

  } catch (error) {
    console.error("An error occurred in pushDataToSheets:", error.message, error.stack);

    SpreadsheetApp.getUi().alert(`An error occurred: ${error.message}`);
  }
}

/**
 * Shows a custom success dialog with hyperlinks.
 */
function showSuccessDialog() {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; font-size: 14px;">
      <p>Data was pushed successfully to the criteria sheets.</p>
      <ul>
        <li><a href="https://docs.google.com/spreadsheets/d/1gaGyH312ad85wpyfH6dGbyNiS4NddqH6NvzTG6RPGPA/edit?gid=524766497#gid=524766497" target="_blank">NAHS Criteria Sheet</a></li>
        <li><a href="https://docs.google.com/spreadsheets/d/1O3DSgTbhphNVDXLmlGkEiyVejsL_l4fPsf2cJJpQpTo/edit?gid=93840204#gid=93840204" target="_blank">NAMS 2024-25 Criteria Sheet</a></li>
      </ul>
    </div>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(200);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Data Push");
}


/**
 * Updates the target sheet with new data, clearing old data and appending a timestamp note in cell A1.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet to update.
 * @param {any[][]} data - The data to write to the target sheet. Each sub-array represents a row.
 * @throws Will throw an error if the target sheet is not found or if other issues occur during the update process.
 */
function updateTargetSheet(sheet, data) {
  try {
    if (!sheet) {
      throw new Error("Target sheet not found!");
    }

    // Clear data from row 2 down
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getMaxColumns()).clearContent();
    }

    // Insert new data starting at row 2
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
    }

    // Add a note in cell A1 with the update timestamp
    const currentDate = new Date();
    sheet.getRange("A1").setNote(`Updated on: ${currentDate.toLocaleDateString()} by script`);

  } catch (error) {
    // Log the error specific to the sheet update process
    console.error(`An error occurred in updateTargetSheet for sheet "${sheet ? sheet.getName() : "Unknown"}":`, error.message, error.stack);

    // Re-throw the error to be caught by the parent function
    throw error;
  }
}
