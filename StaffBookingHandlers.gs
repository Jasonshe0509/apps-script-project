function getBookings() {
  //booking details
  let booking = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  let bookingRange = booking.getRange('B5:Q');
  let bookingData = bookingRange.getValues();

  let customer = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer');
  let customerRange = customer.getRange('B5:E');
  let customerData = customerRange.getValues();

  // Create a map for city IDs to city names
  const customerMap = new Map(customerData.map(row => [row[0], row[3]]));

  const bookings = bookingData.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined)).map(row => {
    let bookingId = row[0];
    let status = row[15];
    let customerId = row[1];
    let typeOfService = row[11];
    let date = new Date(row[2]);
    let startTime = new Date(row[3]);
    let endTime = new Date(row[4]);
    const formattedDate = date instanceof Date
      ? Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy')
      : date;

    // Format times to HH:MM
    let formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get customer name from the customer sheet
    let customerName = customerMap.get(customerId) || 'Unknown Customer';
    return{
      bookingId: bookingId,
      status: status,
      customerName: customerName,
      typeOfService: typeOfService,
      scheduleDate: formattedDate,
      scheduleTime: formattedStartTime + "-" + formattedEndTime
    };
  });

  return bookings;
}