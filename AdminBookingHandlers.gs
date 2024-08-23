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

  //Get Service data
  let serviceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Service');
  let serviceRange = serviceSheet.getRange('C5:F');
  let serviceData = serviceRange.getValues();

  // Create a map for customer IDs to customer names
  const customerMap = new Map(customerData.map(row => [row[0], { mobile: row[1], email: row[2], name: row[3] }]));

  // Create a map for user IDs to full names
  const employeeMap = new Map(employeeData.map(row => [row[0], { name: row[3], mobile: row[4], email: row[5] }]));

  const zoneMap = new Map(zoneData.map(([cityId, cityName]) => [cityId, cityName]));

  const serviceMap = new Map(serviceData.map(row => [row[0], row[3]]))

  // Create a map for booking IDs to their evidence details
  const evidenceMap = new Map();

  evidenceData.forEach(row => {
    let bookingId = row[1];
    let evidenceDetails = {
      evidence_name: row[2],
      image_url: row[3],
      remark: row[4]
    };

    if (!evidenceMap.has(bookingId)) {
      evidenceMap.set(bookingId, []);
    }

    evidenceMap.get(bookingId).push(evidenceDetails);
  });

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

    let evidenceArray = evidenceMap.get(bookingId) || [];

    let feedbackArray = feedbackMap.get(bookingId);

    let error = null;
    if (formattedReachTime > formattedStartTime) {
      error = "The booking start time has been delayed";
    }


    if (formattedCompletedTime > formattedEndTime) {
      error = "The booking progress has been delayed";
    }

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
      totalCost: row[18],
      reachTime: formattedReachTime,
      completedTime: formattedCompletedTime,
      address1: row[5],
      address2: row[6],
      postCode: row[7],
      city: cityName,
      state: row[9],
      employeeDetailsArray: employeeNewDetailsArray,
      evidenceArray: evidenceArray,
      feedbackArray: feedbackArray,
      error: error
    };
  });

  // Sort bookings in descending order by bookingId
  bookings.sort((a, b) => b.bookingId.localeCompare(a.bookingId));

  return bookings;
}


function rejectBooking(bookingId, rejectReason) {
  // Open the spreadsheet and get the Booking sheet
  const bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  const bookingRange = bookingSheet.getRange('B5:X');
  const bookingData = bookingRange.getValues();

  // Get Customer data
  let customerSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer');
  let customerRange = customerSheet.getRange('B5:E');
  let customerData = customerRange.getValues();

  // Create a map for customer IDs to customer names
  const customerMap = new Map(customerData.map(row => [row[0], row[2]]));
  let customerEmail = null
  // Find the row with the matching bookingId
  let rowIndex = -1;
  for (let i = 0; i < bookingData.length; i++) {
    if (bookingData[i][0] === bookingId) { // Assuming bookingId is in column B
      customerEmail = customerMap.get(bookingData[i][1]) || 'Unknown Customer';
      rowIndex = i;
      break;
    }
  }

  // If the bookingId was found
  if (rowIndex !== -1) {
    // Update the status and reject reason
    bookingSheet.getRange(rowIndex + 5, 17).setValue('Canceled'); // Assuming status is in column Q (17th column)
    bookingSheet.getRange(rowIndex + 5, 18).setValue(rejectReason); // Assuming reject reason is in column R (18th column)
    let message = `
    Dear Customer,

    We regret to inform you that your booking with ID ${bookingId} has been rejected. The reason for this decision is as follows:

    ${rejectReason}

    We apologize for any inconvenience this may cause. If you would like to rebook, please click the link below:

    [Rebook Your Booking](https://script.google.com/macros/s/AKfycbxzr-wCjPWrtp4G63CV8r4NeaneCKTtjcya2qMqXQRbMyUQt8oPQ4lFW-61ipH_HCoj/exec?temp=customer_booking)

    We appreciate your understanding.

    Best regards,

    EzBook
    `;
    sendEmail(customerEmail, 'Booking has been rejected', message)
    return { success: true };
  } else {
    Logger.log(`Booking ID ${bookingId} not found.`);
  }
}

function approveBooking(bookingId) {
  // Open the spreadsheet and get the Booking sheet
  const bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  const bookingRange = bookingSheet.getRange('B5:X');
  const bookingData = bookingRange.getValues();

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

  // Create a map for customer IDs to customer names and emails
  const customerMap = new Map(customerData.map(row => [row[0], { email: row[2], name: row[3] }]));
  let customerEmail = null;
  let customerName = null;

  // Create a map for user IDs to emails
  const employeeMap = new Map(employeeData.map(row => [row[0], row[5]]));
  let employeeEmails = [];

  // Find the row with the matching bookingId
  let rowIndex = -1;
  for (let i = 0; i < bookingData.length; i++) {
    if (bookingData[i][0] === bookingId) { // Assuming bookingId is in column B
      let customerDetails = customerMap.get(bookingData[i][1]);
      customerEmail = customerDetails.email || 'Unknown Customer';
      customerName = customerDetails.name || 'Unknown Customer';
      rowIndex = i;
      break;
    }
  }

  // Get the employee emails associated with the bookingId
  for (let i = 0; i < employeeAppointmentData.length; i++) {
    if (employeeAppointmentData[i][0] === bookingId) {
      let userId = employeeAppointmentData[i][1];
      let employeeEmail = employeeMap.get(userId);
      if (employeeEmail) {
        employeeEmails.push(employeeEmail);
      }
    }
  }
  employeeEmails.push('jasonshe80@gmail.com');

  // Combine customer email and employee emails into one array
  let emailArray = [customerEmail, ...employeeEmails];

  // If the bookingId was found
  if (rowIndex !== -1) {
    // Update the status and reject reason
    bookingSheet.getRange(rowIndex + 5, 17).setValue('Scheduled'); // Assuming status is in column Q (17th column)

    let bookingDetails = bookingData[rowIndex];
    let date = new Date(bookingDetails[2]);
    let startTime = new Date(bookingDetails[3]);
    let endTime = new Date(bookingDetails[4]);

    var startDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startTime.getHours(), startTime.getMinutes(), startTime.getSeconds());
    Logger.log(startDateTime);

    var endDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endTime.getHours(), endTime.getMinutes(), endTime.getSeconds());


    let formattedDate = Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    let formattedStartTime = Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'HH:mm:ss');
    let formattedEndTime = Utilities.formatDate(endTime, Session.getScriptTimeZone(), 'HH:mm:ss');

    let emailBody = `
      Dear ${customerName},

      We are pleased to inform you that your booking with ID ${bookingId} has been approved.

      Below are the details of your confirmed booking:
      - **Date:** ${formattedDate}
      - **Time:** ${formattedStartTime} - ${formattedEndTime}
      - **Service Type:** ${bookingDetails[11]}

      We look forward to providing you with our services.

      Best regards,
      EzBook Team
    `;

    // Send email notification
    sendEmail(customerEmail, 'Booking has been approved', emailBody);

    // Create a calendar invite
    let description = `Booking ID: ${bookingId}
                       Type of Service: ${bookingDetails[11]}
                       Customer: ${customerName}
                       Date: ${formattedDate}
                       Time: ${formattedStartTime} - ${formattedEndTime}`;

    createCalendarInvite('Service Booking', startDateTime, endDateTime, description, emailArray);

    return { success: true };
  } else {
    Logger.log(`Booking ID ${bookingId} not found.`);
    return { success: false, message: `Booking ID ${bookingId} not found.` };
  }
}

function setTotalCost(bookingId, totalCost) {
  // Open the spreadsheet and get the Booking sheet
  const bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  const bookingRange = bookingSheet.getRange('B5:X');
  const bookingData = bookingRange.getValues();

  // Get Employee Appointment data
  let employeeAppointmentSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee Appointment');
  let employeeAppointmentRange = employeeAppointmentSheet.getRange('B5:C');
  let employeeAppointmentData = employeeAppointmentRange.getValues();

  const invoiceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  const invoiceRange = invoiceSheet.getRange('B5:M'); // Read data starting from B5
  const invoiceData = invoiceRange.getValues();

  let currentDateTime = getCurrentDateTime();

  let employeeId = null;
  const filteredData = employeeAppointmentData.filter(row => row[0] === bookingId);

  if (filteredData.length > 0) {
    employeeId = filteredData[0][1];
  }


  let rowIndex = -1;
  let customerID = null
  for (let i = 0; i < bookingData.length; i++) {
    if (bookingData[i][0] === bookingId) { // Assuming bookingId is in column B
      customerID = bookingData[i][1];
      rowIndex = i;
      break;
    }
  }

  if (rowIndex !== -1) {
    // Update the status and reject reason
    bookingSheet.getRange(rowIndex + 5, 20).setValue(totalCost); // Assuming status is in column Q (17th column)
    var lastId = '';
    for (var i = 1; i < invoiceData.length; i++) { // Start from 1 to skip headers
      var invoiceId = invoiceData[i][0]; // Assuming invoice ID is in the first column (index 0)
      if (invoiceId.startsWith('INV')) {
        lastId = invoiceId;
      }
    }
    var newIdNumber = parseInt(lastId.replace('INV', '')) + 1;

    // Format the number to ensure it's always three digits
    var formattedNumber = newIdNumber.toString().padStart(3, '0');

    // Generate the new invoice ID
    var newInvoiceId = 'INV' + formattedNumber;

    // Define the new invoice data
    var newInvoice = [
      '',
      newInvoiceId, // invoice id
      bookingId, // booking id
      customerID, // customer id
      employeeId, // employee id
      'Open', // Invoice status
      totalCost, // Payment Amount
      0, // Paid Amount
      14, // Duration
      '', // invoice url
      '', // receipt url
      currentDateTime, // created date
      currentDateTime // updated date
    ];

    invoiceSheet.appendRow(newInvoice);
    generateInvoices(newInvoiceId, bookingId, customerID, employeeId, totalCost, '14', currentDateTime);
    return { success: true };
  } else {
    Logger.log(`Booking ID ${bookingId} not found.`);
  }
}

function addEmployeetoBooking(bookingID, employeeID) {
  let employeeAppointmentSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee Appointment');
  let currentDateTime = getCurrentDateTime();

  // Append the row with an array of values
  employeeAppointmentSheet.appendRow(['', bookingID, employeeID, currentDateTime]);

  return { success: true };
}
