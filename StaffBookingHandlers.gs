function getBookings() {

  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);

  var userDetails = JSON.parse(userSession);
  var userId = userDetails.userID;

  //booking details
  let booking = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  let bookingRange = booking.getRange('B5:Q');
  let bookingData = bookingRange.getValues();

  let customer = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer');
  let customerRange = customer.getRange('B5:E');
  let customerData = customerRange.getValues();

  let employeeAppointment = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee Appointment');
  let employeeAppointmentRange = employeeAppointment.getRange('B5:C');
  let employeeAppointmentData = employeeAppointmentRange.getValues();

  // Create a map for customer IDs to customer names
  const customerMap = new Map(customerData.map(row => [row[0], row[3]]));

  // Create a set of booking IDs associated with the current user
  const userBookingIds = new Set(employeeAppointmentData
    .filter(row => row[1] == userId)
    .map(row => row[0]));

  const bookings = bookingData
    .filter(row =>
      userBookingIds.has(row[0]) &&
      row.some(cell => cell !== '' && cell !== null && cell !== undefined) &&
      row[15] !== 'Pending' &&
      row[15] !== 'Canceled'
    )
    .map(row => {
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
      return {
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

function getFullBookingDetails(bookingID) {
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
  let feedbackData = feedbackRange.getValues();

  // Create a map for customer IDs to customer names
  const customerMap = new Map(customerData.map(row => [row[0], { mobile: row[1], email: row[2], name: row[3] }]));

  // Create a map for user IDs to full names
  const employeeMap = new Map(employeeData.map(row => [row[0], { name: row[3], mobile: row[4], email: row[5] }]));

  const zoneMap = new Map(zoneData.map(([cityId, cityName]) => [cityId, cityName]));

  const evidenceMap = new Map(evidenceData.map(row => [row[1], { evidence_name: row[2], image_url: row[3], remark: row[4] }]));

  const feedbackMap = new Map(feedbackData.map(row => [row[1], { feedback_name: row[2], rate: row[3] }]));

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

  // Find the booking data by booking ID
  let bookingRow = bookingData.find(row => row[0] === bookingID);
  if (!bookingRow) {
    return null; // Booking ID not found
  }

  let status = bookingRow[15];
  let customerId = bookingRow[1];
  let typeOfService = bookingRow[11];
  let date = new Date(bookingRow[2]);
  let startTime = new Date(bookingRow[3]);
  let endTime = new Date(bookingRow[4]);
  let reachTime = new Date(bookingRow[21]);
  let completedTime = new Date(bookingRow[22]);
  const formattedDate = date instanceof Date
    ? Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')
    : date;
  Logger.log(formattedDate);
  // Format times to HH:MM
  let formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let formattedReachTime = reachTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let formattedCompletedTime = completedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get customer name from the customer sheet
  let customerDetails = customerMap.get(customerId) || 'Unknown Customer';
  let cityName = zoneMap.get(bookingRow[8]);

  // Get employee details for the booking
  let employeeDetailsArray = bookingEmployeeMap.get(bookingID);
  let employeeNamesString = employeeDetailsArray ? employeeDetailsArray.map(emp => emp.name).join(', ') : '-';
  let employeeNewDetailsArray = bookingEmployeeMap.get(bookingID);

  let evidenceArray = evidenceMap.get(bookingID);

  let feedbackArray = feedbackMap.get(bookingID);

  return {
    bookingId: bookingID,
    status: status,
    customerDetails: customerDetails,
    typeOfService: typeOfService,
    scheduleDate: formattedDate,
    scheduleTime: formattedStartTime + "-" + formattedEndTime,
    employees: employeeNamesString,
    typeOfDevice: bookingRow[12],
    numberOfDeviceService: bookingRow[13],
    additionalRemark: bookingRow[14],
    rejectReason: bookingRow[16],
    reachTime: formattedReachTime,
    completedTime: formattedCompletedTime,
    address1: bookingRow[5],
    address2: bookingRow[6],
    postCode: bookingRow[7],
    city: cityName,
    state: bookingRow[9],
    employeeDetailsArray: employeeNewDetailsArray,
    evidenceArray: evidenceArray,
    feedbackArray: feedbackArray,
    startTime: formattedStartTime,
    endTime: formattedEndTime
  };
}
