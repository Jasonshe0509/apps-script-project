function getCustomerData() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer'); // Adjust sheet name as needed
  let dataRange = sheet.getRange('B5:E'); // Adjust range to include Customer ID and Name columns
  let data = dataRange.getValues();

  let customerMap = {};
  data.forEach(row => {
    let customerId = row[0];
    let customerName = row[3];
    if (customerId) {
      customerMap[customerId] = customerName;
    }
  });

  return customerMap;
}

function getFullCustomerData() {
  const ss = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const customerSheet = ss.getSheetByName('Customer');
  const bookingSheet = ss.getSheetByName('Booking');

  // Get customer data
  const customerRange = customerSheet.getRange('B5:E'); // Adjust to include all relevant columns
  const customers = customerRange.getValues();

  // Get booking data
  const bookingRange = bookingSheet.getRange('C5:C'); // Adjust to include all relevant columns
  const bookings = bookingRange.getValues();

  // Create a map to count bookings by customer ID
  const bookingCount = {};
  bookings.forEach(row => {
    const customerId = row[0]; // 'cus_id' is in the first column of the booking sheet
    if (customerId) {
      if (!bookingCount[customerId]) {
        bookingCount[customerId] = 0;
      }
      bookingCount[customerId]++;
    }
  });

  // Filter out rows where all cells are empty and add booking count
  const updatedCustomers = customers
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
    .map(row => {
      const customerId = row[0]; // 'cus_id' is in the first column
      row.push(bookingCount[customerId] || 0); // Add booking count (0 if none)
      return row;
    });

  return updatedCustomers;
}


