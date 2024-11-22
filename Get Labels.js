/**
 * This is a utility formula used to get the list of Gmail labels.
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
