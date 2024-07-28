function getCustomerBookings() {
  // Get Booking data
  let bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  let bookingRange = bookingSheet.getRange('B5:X');
  let bookingData = bookingRange.getValues();

  // Get Customer data
  let customerSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer');
  let customerRange = customerSheet.getRange('B5:E');
  let customerData = customerRange.getValues();

  // Get Employee Appointment data
  let employeeAppointmentSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee Appointment');
  let employeeAppointmentRange = employeeAppointmentSheet.getRange('B5:C');
  let employeeAppointmentData = employeeAppointmentRange.getValues();

  // Get Employee data
  let employeeSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('User');
  let employeeRange = employeeSheet.getRange('B5:G');
  let employeeData = employeeRange.getValues();

  // Get Zone Data
  let zoneSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Zone');
  let zoneRange = zoneSheet.getRange('B5:C');
  let zoneData = zoneRange.getValues();

  // Get Evidence Data
  let evidenceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Evidence');
  let evidenceRange = evidenceSheet.getRange('B5:F');
  let evidenceData = evidenceRange.getValues();

  // Get Feedback Data
  let feedbackSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Feedback');
  let feedbackRange = feedbackSheet.getRange('B5:F');
  let feedbackDate = feedbackRange.getValues();

  // Create a map for customer IDs to customer names
  const customerMap = new Map(customerData.map(row => [row[0], { mobile: row[1], email: row[2], name: row[3] }]));

  // Create a map for user IDs to full names
  const employeeMap = new Map(employeeData.map(row => [row[0], { name: row[3], mobile: row[4], email: row[5] }]));

  const zoneMap = new Map(zoneData.map(([cityId, cityName]) => [cityId, cityName]));

  const evidenceMap = new Map(evidenceData.map(row => [row[1], { evidence_name: row[2], image_url: row[3], remark: row[4] }]));

  const feedbackMap = new Map(feedbackDate.map(row => [row[1], { feedback_name: row[2], rate: row[3] }]));

  // Create a map for booking IDs to assigned employee details
  const bookingEmployeeMap = new Map();
  employeeAppointmentData.forEach(row => {
    let bookingId = row[0];
    let userId = row[1];
    let employeeDetails = employeeMap.get(userId) || { name: 'Unknown Employee', mobile: '', email: '' };
    if (!bookingEmployeeMap.has(bookingId)) {
      bookingEmployeeMap.set(bookingId, []);
    }
    bookingEmployeeMap.get(bookingId).push(employeeDetails);
  });

  // Process booking data
  const bookings = bookingData.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined)).map(row => {
    let bookingId = row[0];
    let status = row[15];
    let customerId = row[1];
    let typeOfService = row[11];
    let date = new Date(row[2]);
    let startTime = new Date(row[3]);
    let endTime = new Date(row[4]);
    let reachTime = new Date(row[21]);
    let completedTime = new Date(row[22]);
    const formattedDate = date instanceof Date
      ? Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy')
      : date;

    // Format times to HH:MM
    let formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let formattedReachTime = reachTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let formattedCompletedTime = completedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get customer name from the customer sheet
    let customerDetails = customerMap.get(customerId) || 'Unknown Customer';
    let cityName = zoneMap.get(row[8]);

    // Get employee details for the booking
    let employeeDetailsArray = bookingEmployeeMap.get(bookingId);
    let employeeNamesString = employeeDetailsArray ? employeeDetailsArray.map(emp => emp.name).join(', ') : '-';
    let employeeNewDetailsArray = bookingEmployeeMap.get(bookingId);

    let evidenceArray = evidenceMap.get(bookingId);

    let feedbackArray = feedbackMap.get(bookingId);

    return {
      bookingId: bookingId,
      status: status,
      customerDetails: customerDetails,
      typeOfService: typeOfService,
      scheduleDate: formattedDate,
      scheduleTime: formattedStartTime + "-" + formattedEndTime,
      employees: employeeNamesString,
      typeOfDevice: row[12],
      numberOfDeviceService: row[13],
      additionalRemark: row[14],
      rejectReason: row[16],
      reachTime: formattedReachTime,
      completedTime: formattedCompletedTime,
      address1: row[5],
      address2: row[6],
      postCode: row[7],
      city: cityName,
      state: row[9],
      employeeDetailsArray: employeeNewDetailsArray,
      evidenceArray: evidenceArray,
      feedbackArray: feedbackArray
    };
  });

  return bookings;
}
