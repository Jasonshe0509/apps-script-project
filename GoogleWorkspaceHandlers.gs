function sendEmail(recipient, subject, body) {
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    from: 'jasonshe80@gmail.com'
  });

  return "Email sent!";
}

function createCalendarInvite(title, startTime, endTime, description, guestEmails) {
  var calendar = CalendarApp.getDefaultCalendar(); // Get the user's default calendar

  try {
    // Create the event with the specified details and guests
    var event = calendar.createEvent(title, startTime, endTime, {
      description: description,
      guests: guestEmails.join(','),
      sendInvites: true
    });

    // Log the event ID
    Logger.log('Event created with ID: ' + event.getId());
  } catch (e) {
    Logger.log('Error creating event: ' + e.toString());
  }
}

function generateInvoices(invoiceId, bookingId, customerId, employeeId, paymentAmount, duration, createdDate) {
  var folder = DriveApp.getFolderById('1dQZ-rs1dKAKNIqk1ZzFV6Z_hoLpaCv9v');
  var files = folder.getFilesByName('Project Database');
  if (!files.hasNext()) {
    Logger.log('Spreadsheet not found!');
    return;
  }
  var spreadsheet = SpreadsheetApp.open(files.next());

  var invoiceSheet = spreadsheet.getSheetByName('Invoice');
  var invoiceData = invoiceSheet.getRange('B5:L').getValues(); // Read data starting from B5

  var bookingSheet = spreadsheet.getSheetByName('Booking');
  var bookingData = bookingSheet.getRange('B5:M').getValues(); // Read data starting from B5

  var customerSheet = spreadsheet.getSheetByName('Customer');
  var customerData = customerSheet.getRange('B5:E').getValues(); // Read data starting from B5

  var employeeSheet = spreadsheet.getSheetByName('User');
  var employeeData = employeeSheet.getRange('B5:R').getValues(); // Read data starting from B5

  var itemDescription = '';
  for (var j = 0; j < bookingData.length; j++) {
    if (bookingData[j][0] == bookingId) {
      itemDescription = bookingData[j][11]; // Column M corresponds to index 11 in zero-indexed array
      Logger.log('Found description for booking ID ' + bookingId + ': ' + itemDescription);
      break;
    }
  }

  if (!itemDescription) {
    Logger.log('No description found for booking ID ' + bookingId);
  }

  var customerName = '';
  for (var k = 0; k < customerData.length; k++) {
    if (customerData[k][0] == customerId) {
      customerName = customerData[k][3]; // Column E corresponds to index 3 in zero-indexed array
      Logger.log('Found customer name for ' + customerId + ': ' + customerName);
      break;
    }
  }

  if (!customerName) {
    Logger.log('No customer name found for ' + customerId);
  }

  var employeeName = '';
  for (var l = 0; l < employeeData.length; l++) {
    if (employeeData[l][0] == employeeId) {
      employeeName = employeeData[l][3]; // Update the index to correct one if needed
      Logger.log('Found employee name for ' + employeeId + ': ' + employeeName);
      break;
    }
  }

  if (!employeeName) {
    Logger.log('No employee name found for ' + employeeId);
  }

  // Pass the employeeName instead of employeeId
  createInvoicePdf(invoiceId, bookingId, customerName, employeeName, paymentAmount, duration, createdDate, itemDescription);
}

function createInvoicePdf(invoiceId, bookingId, customerName, employeeName, paymentAmount, duration, createdDate, itemDescription) {
  var doc = DocumentApp.create('Invoice ' + invoiceId);
  var body = doc.getBody();

  Logger.log('Creating invoice for ID: ' + invoiceId);

  var logoFolder = DriveApp.getFolderById('1W3aUrAnkTj0BVwl_mXgOOGlpnuq551u1');
  var logo = logoFolder.getFilesByName('logo.png').next();

  var headerTable = body.appendTable();
  var headerRow = headerTable.appendTableRow();
  var logoCell = headerRow.appendTableCell();
  var titleCell = headerRow.appendTableCell();

  logoCell.appendImage(logo.getBlob());
  logoCell.setWidth(150);

  var titleText = titleCell.appendParagraph('Invoice');
  titleText.setFontSize(24).setBold(true);
  titleCell.setVerticalAlignment(DocumentApp.VerticalAlignment.MIDDLE);
  
  paymentAmount = Number(paymentAmount);

  body.appendParagraph('\nInvoice ID: ' + invoiceId);
  body.appendParagraph('Booking ID: ' + bookingId);
  body.appendParagraph('Customer Name: ' + customerName);
  body.appendParagraph('Employee Name: ' + employeeName);
  body.appendParagraph('Payment Amount: ' + paymentAmount.toFixed(2));
  body.appendParagraph('Created Date: ' + createdDate);

  var invoiceTable = body.appendTable();
  var tableHeader = invoiceTable.appendTableRow();
  tableHeader.appendTableCell('Item & Description').setBold(true);
  tableHeader.appendTableCell('Qty').setBold(true);
  tableHeader.appendTableCell('Rate').setBold(true);
  tableHeader.appendTableCell('Amount').setBold(true);

  var tableRow = invoiceTable.appendTableRow();
  tableRow.appendTableCell(itemDescription || 'No description available');
  tableRow.appendTableCell('1.00');
  tableRow.appendTableCell(paymentAmount.toFixed(2));
  tableRow.appendTableCell(paymentAmount.toFixed(2));

  var totalRow = invoiceTable.appendTableRow();
  totalRow.appendTableCell('Total').setBold(true);
  totalRow.appendTableCell('');
  totalRow.appendTableCell('');
  totalRow.appendTableCell(paymentAmount.toFixed(2)).setBold(true);

  body.appendParagraph('\nNotes\n\nThank you for your business.');

  var termsParagraph = body.appendParagraph('Terms & Conditions');
  termsParagraph.setBold(true);
  body.appendParagraph('Failure to make payment in another ' + duration + ' days will result in late fee.');

  doc.saveAndClose();

  Utilities.sleep(500);

  var pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  var invoiceFolder = DriveApp.getFolderById('1g9br747XdRXDbBataJwzyAEdR6fozchw');
  var pdfFile = invoiceFolder.createFile(pdfBlob).setName('Invoice ' + invoiceId + '.pdf');

  var invoiceUrl = pdfFile.getUrl();
  updateInvoiceUrl(invoiceId, invoiceUrl);
}

function updateInvoiceUrl(invoiceId, invoiceUrl) {
  var folder = DriveApp.getFolderById('1dQZ-rs1dKAKNIqk1ZzFV6Z_hoLpaCv9v');
  var files = folder.getFilesByName('Project Database');
  if (!files.hasNext()) {
    Logger.log('Spreadsheet not found!');
    return;
  }
  var spreadsheet = SpreadsheetApp.open(files.next());

  var sheet = spreadsheet.getSheetByName('Invoice');
  var data = sheet.getRange('B5:L').getValues(); // Read data starting from B5

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] == invoiceId) {
      sheet.getRange(i + 5, 10).setValue(invoiceUrl); // Update the URL in column K
      break;
    }
  }
}



