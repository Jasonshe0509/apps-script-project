function getCustomerInvoice() {
  // Get Invoice data
  let invoiceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let invoiceRange = invoiceSheet.getRange('B5:L');
  let invoiceData = invoiceRange.getValues();

  // Get Customer Receipt data
  let receiptSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer_Receipt');
  let receiptRange = receiptSheet.getRange('C5:D');
  let receiptData = receiptRange.getValues();


  const customerReceiptMap = new Map(receiptData.map(([invoiceId, receiptUrl]) => [invoiceId, receiptUrl]));

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

    let customerReceiptUrl = customerReceiptMap.get(invoiceId);

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
      customerReceiptUrl: customerReceiptUrl
    };
  });

  return invoices;
}
