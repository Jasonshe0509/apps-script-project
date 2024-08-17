function getCustomerInvoice() {
  // Get Invoice data
  let invoiceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let invoiceRange = invoiceSheet.getRange('B5:L');
  let invoiceData = invoiceRange.getValues();

  // Get Customer Receipt data
  let receiptSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer_Receipt');
  let receiptRange = receiptSheet.getRange('C5:D');
  let receiptData = receiptRange.getValues();

  // Create a map where each invoiceId has an array of receipt URLs
  const customerReceiptMap = new Map();

  receiptData.forEach(([invoiceId, receiptUrl]) => {
    if (!customerReceiptMap.has(invoiceId)) {
      customerReceiptMap.set(invoiceId, []);
    }
    customerReceiptMap.get(invoiceId).push(receiptUrl);
  });

  // Process booking data
  const invoices = invoiceData.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined)).map(row => {
    let invoiceId = row[0];
    let bookingId = row[1];
    let status = row[4];
    let paymentAmount = row[5];
    let paidAmount = row[6];
    let duration = row[7];
    let invoiceUrl = row[8];
    let receiptUrl = row[9];
    let createdDate = new Date(row[10]);

    // Format date to YYYY-MM-DD
    let formattedDate = createdDate.toLocaleDateString('en-CA'); // 'en-CA' gives the date in YYYY-MM-DD format

    // Format times to HH:MM
    let formattedTime = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Combine date and time
    let formattedCreatedDateTime = `${formattedDate} ${formattedTime}`;

    let customerReceiptUrls = customerReceiptMap.get(invoiceId) || [];

    return {
      invoiceId: invoiceId,
      bookingId: bookingId,
      status: status,
      paymentAmount: paymentAmount,
      paidAmount: paidAmount,
      duration: duration,
      invoiceUrl: invoiceUrl,
      receiptUrl: receiptUrl,
      createdDate: formattedCreatedDateTime,
      customerReceiptUrls: customerReceiptUrls
    };
  });

  invoices.sort((a, b) => b.invoiceId.localeCompare(a.invoiceId));

  return invoices;
}

function checkOverdueInvoice() {
  // Get Invoice data
  let invoiceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let invoiceRange = invoiceSheet.getRange('B5:L'); // Adjust range as needed
  let invoiceData = invoiceRange.getValues();

  const today = new Date(); // Current date

  // Loop through rows, starting from index 0 if no header
  for (let i = 0; i < invoiceData.length; i++) {
    const createdDate = new Date(invoiceData[i][10]); // Created date in column K (index 10)
    const duration = invoiceData[i][7]; // Duration in column H (index 7)
    const invoiceStatus = invoiceData[i][4]; // Current status in column E (index 4)

    // Check if duration is defined and is a valid number
    if (duration && !isNaN(duration)) {
      const dueDate = new Date(createdDate.getTime() + (duration * 24 * 60 * 60 * 1000)); // Calculate due date

      // If the current date is past the due date and status is "Open"
      if (today > dueDate && invoiceStatus == 'Open') {
        invoiceSheet.getRange(i + 5, 6).setValue('Overdue');
      }
    }
  }
}

function remainInvoiceOpen(invoiceId, status, paidAmount, uploadedFile) {
  // Get Invoice data
  let invoiceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let invoiceRange = invoiceSheet.getRange('B5:M');
  let invoiceData = invoiceRange.getValues();

  // Get Customer Receipt data
  let receiptSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer_Receipt');
  let receiptRange = receiptSheet.getRange('B5:E');
  let receiptData = receiptRange.getValues();

  let currentDateTime = getCurrentDateTime();

  for (let i = 0; i < invoiceData.length; i++) {
    if (invoiceData[i][0] === invoiceId) {
      // Update the paid amount and the last updated date in the Invoice sheet
      invoiceSheet.getRange(i + 5, 8).setValue(paidAmount);
      invoiceSheet.getRange(i + 5, 13).setValue(currentDateTime);

      if (uploadedFile) {
        const driveFolder = DriveApp.getFolderById('1L-y2jqXHCTXhD3NgidDRQ5tn6cqAb8lU');
        const invoiceFolderName = invoiceId;
        let invoiceFolder;

        // Check if the folder for the invoice ID already exists
        const folders = driveFolder.getFoldersByName(invoiceFolderName);
        if (folders.hasNext()) {
          invoiceFolder = folders.next();
        } else {
          // Create a new folder for the invoice ID
          invoiceFolder = driveFolder.createFolder(invoiceFolderName);
        }

        try {
          // Decode Base64 encoded file content
          const base64Data = uploadedFile.content;
          const decodedBytes = Utilities.base64Decode(base64Data);
          const fileBlob = Utilities.newBlob(decodedBytes, uploadedFile.mimeType, uploadedFile.name);
          const file = invoiceFolder.createFile(fileBlob);
          const fileUrl = file.getUrl();

          // Append a new row in the Customer Receipt sheet
          const lastRow = receiptSheet.getLastRow();
          const nextId = lastRow + 1;

          // Append the new row with ID, Invoice ID, URL, and createdDate
          receiptSheet.appendRow([' ', nextId, invoiceId, fileUrl, currentDateTime]);
        } catch (e) {
          Logger.log('Error decoding file content: ' + e.message);
        }
      }

      break;
    }
  }
  return { success: true };
}

function changeInvoiceStatus(invoiceId, status) {
  // Get Invoice data
  let invoiceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let invoiceRange = invoiceSheet.getRange('B5:M');
  let invoiceData = invoiceRange.getValues();

  let currentDateTime = getCurrentDateTime();

  for (let i = 0; i < invoiceData.length; i++) {
    if (invoiceData[i][0] === invoiceId) {
      // Update the paid amount and the last updated date in the Invoice sheet
      invoiceSheet.getRange(i + 5, 6).setValue("Open");
      invoiceSheet.getRange(i + 5, 13).setValue(currentDateTime);
    }
  }
  return { success: true };
}

function markInvoiceClose(invoiceId, paidAmount, uploadedFile) {
  // Get Invoice data
  let invoiceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let invoiceRange = invoiceSheet.getRange('B5:M');
  let invoiceData = invoiceRange.getValues();

  // Get Customer Receipt data
  let receiptSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer_Receipt');

  let currentDateTime = getCurrentDateTime();

  for (let i = 0; i < invoiceData.length; i++) {
    if (invoiceData[i][0] === invoiceId) {
      // Update the paid amount and the last updated date in the Invoice sheet
      invoiceSheet.getRange(i + 5, 6).setValue("Close");
      invoiceSheet.getRange(i + 5, 8).setValue(paidAmount);
      invoiceSheet.getRange(i + 5, 13).setValue(currentDateTime);

      if (uploadedFile) {
        const driveFolder = DriveApp.getFolderById('1L-y2jqXHCTXhD3NgidDRQ5tn6cqAb8lU');
        const invoiceFolderName = invoiceId;
        let invoiceFolder;

        // Check if the folder for the invoice ID already exists
        const folders = driveFolder.getFoldersByName(invoiceFolderName);
        if (folders.hasNext()) {
          invoiceFolder = folders.next();
        } else {
          // Create a new folder for the invoice ID
          invoiceFolder = driveFolder.createFolder(invoiceFolderName);
        }

        try {
          // Decode Base64 encoded file content
          const base64Data = uploadedFile.content;
          const decodedBytes = Utilities.base64Decode(base64Data);
          const fileBlob = Utilities.newBlob(decodedBytes, uploadedFile.mimeType, uploadedFile.name);
          const file = invoiceFolder.createFile(fileBlob);
          const fileUrl = file.getUrl();

          // Append a new row in the Customer Receipt sheet
          const lastRow = receiptSheet.getLastRow();
          const nextId = lastRow + 1;

          // Append the new row with ID, Invoice ID, URL, and createdDate
          receiptSheet.appendRow([' ', nextId, invoiceId, fileUrl, currentDateTime]);

          generateReceipts(invoiceId, invoiceData[i][1], invoiceData[i][2], invoiceData[i][3], invoiceData[i][5], paidAmount, currentDateTime)
        } catch (e) {
          Logger.log('Error decoding file content: ' + e.message);
        }
      }
      break;
    }
  }
  return { success: true };
}