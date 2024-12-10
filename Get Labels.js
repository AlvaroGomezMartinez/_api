/**
 * This is a utility formula that was used to get the list of Gmail labels.
 * It was only run to get the label names for the main function.
*/
function listGmailLabels() {
  const labels = GmailApp.getUserLabels();
  if (labels.length === 0) {
    Logger.log("No labels found in your Gmail account.");
  } else {
    Logger.log("Your Gmail labels:");
    labels.forEach(label => Logger.log(label.getName()));
  }
}
