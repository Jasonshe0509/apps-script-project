function getCustomerData() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer'); // Adjust sheet name as needed
  let dataRange = sheet.getRange('B5:E'); // Adjust range to include Customer ID and Name columns
  let data = dataRange.getValues();

  let customerMap = {};
  data.forEach(row => {
    let customerId = row[0];
    let customerMobile = row[1];
    let customerName = row[3];
    if (customerId) {
      customerMap[customerId] = {
        name: customerName,
        mobile: customerMobile
      };
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

function handleCustomerBookService(e) {
  var phoneRegex = /^60\d{9,10}$/;
  var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  var currentDateTime = getCurrentDateTime();
  var error_message = null;

  let customerSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Customer');
  let customerDataRange = customerSheet.getRange('B5:F'); // Adjust range to include Customer ID and Name columns
  let customerData = customerDataRange.getValues();

  let serviceSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Service');
  var serviceDataRange = serviceSheet.getRange('B5:F'); // Adjusted to get the right range
  var serviceData = serviceDataRange.getValues();

  let bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');

  let bookingLastRow = bookingSheet.getLastRow();
  let newBookingRow = bookingLastRow + 1;
  let lastBookingID = bookingSheet.getRange(bookingLastRow, 2).getValue();
  let prefix = lastBookingID.slice(0, 2); // Get the prefix (e.g., "BK")
  let numberPart = parseInt(lastBookingID.slice(2)) + 1; // Extract numeric part and increment
  let newBookingID = prefix + numberPart.toString().padStart(3, '0');

  const zoneSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Zone');
  const zoneRange = zoneSheet.getRange('B5:C');
  const zones = zoneRange.getValues();

  const zoneMap = new Map(zones.map(row => [row[1], row[0]]));

  if (phoneRegex.test(e.parameter.contact)) {
    if (emailRegex.test(e.parameter.email)) {
      if (e.parameter.city != null) {
        if (e.parameter.state != null) {
          if (e.parameter.date > currentDateTime) {
            if (e.parameter.aircond_type != null) {
              if (e.parameter.service_type != null) {
                // Check if contact already exists
                let contactExists = false;
                let lastRow = customerSheet.getLastRow();
                let newCustomerRow = lastRow + 1;
                let customerID = null;

                for (let i = 0; i < customerData.length; i++) {
                  if (customerData[i][1] == e.parameter.contact) { // Assuming contact number is in column D
                    contactExists = true;
                    customerID = customerData[i][0];
                    break;
                  }
                }

                if (!contactExists) {
                  // If contact doesn't exist, create a new customer
                  customerSheet.getRange(newCustomerRow, 2, 1, 5).setValues([[newCustomerRow - 4, e.parameter.contact, e.parameter.email, e.parameter.name, currentDateTime]]);
                  customerID = newCustomerRow - 4;
                }

                let no_employee = null;
                let estimatedTime = null;
                for (let i = 0; i < serviceData.length; i++) {
                  if (serviceData[i][1] == e.parameter.service_type) {
                    no_employee = serviceData[i][3];
                    estimatedTime = serviceData[i][4];
                    break;
                  }
                }
                let finalEstimatedTime = estimatedTime * e.parameter.no_device_service;
                let bookingTime = new Date(e.parameter.date + ' ' + e.parameter.time);
                bookingTime.setMinutes(bookingTime.getMinutes() + finalEstimatedTime);
                let endTime = bookingTime.toTimeString().split(' ')[0];
                let cityID = zoneMap.get(e.parameter.city);

                bookingSheet.getRange(newBookingRow, 2, 1, 20).setValues([[newBookingID, customerID, e.parameter.date, e.parameter.time, endTime, e.parameter.address1, e.parameter.address2, e.parameter.postcode, cityID, e.parameter.state, 'Malaysia', e.parameter.service_type, e.parameter.service_type, e.parameter.no_device_service, e.parameter.remark, 'Pending', '', '', '', currentDateTime]]);

                var template = HtmlService.createTemplateFromFile('customer_booking_confirmation');
                var bookingData = {
                  bookingID: newBookingID,
                  date: e.parameter.date,
                  time: e.parameter.time + " - " + endTime,
                  service: e.parameter.service_type
                }
                template.bookingData = bookingData;
                return template.evaluate()
                  .setTitle('Customer Booking Confirmation Page')
                  .addMetaTag('viewport', 'width=device-width, initial-scale=1')
                  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
              } else {
                error_message = "Service type cannot be null";
              }
            } else {
              error_message = "Aricond type cannot be null";
            }
          } else {
            error_message = "The booking date must be longer than current date"
          }
        } else {
          error_message = "State cannot be null";
        }
      } else {
        error_message = "City cannot be null";
      }
    } else {
      error_message = "Wrong email format";
    }
  } else {
    error_message = "Wrong contact number format";
  }
  var template = HtmlService.createTemplateFromFile('customer_booking');
  var bookingData = {
    name: e.parameter.name,
    contact: e.parameter.contact,
    email: e.parameter.email,
    address1: e.parameter.address1,
    address2: e.parameter.address2,
    postcode: e.parameter.postcode,
    city: e.parameter.city,
    state: e.parameter.state,
    date: e.parameter.date,
    time: e.parameter.time,
    aircond_type: e.parameter.aircond_type,
    service_type: e.parameter.service_type,
    no_device_service: e.parameter.no_device_service,
    remakr: e.parameter.remark,
    error_message: error_message,
  }
  template.bookingData = bookingData;
  return template.evaluate()
    .setTitle('Customer Booking Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleCustomerCancelBooking(e) {
  // Open the spreadsheet and get the Booking sheet
  const bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  const bookingRange = bookingSheet.getRange('B5:X');
  const bookingData = bookingRange.getValues();

  let error_message = null;

  let rowIndex = -1;
  for (let i = 0; i < bookingData.length; i++) {
    if (bookingData[i][0] === e.parameter.bookingID && (bookingData[i][15] != 'Completed' && bookingData[i][15] != 'On Going' && bookingData[i][15] != 'Canceled')) { // Assuming bookingId is in column B
      rowIndex = i;
      break;
    }
  }
  if (rowIndex != -1) {
    bookingSheet.getRange(rowIndex + 5, 17).setValue('Canceled'); // Assuming status is in column Q (17th column)
    bookingSheet.getRange(rowIndex + 5, 18).setValue(e.parameter.cancel_reason); // Assuming reject reason is in column R (18th column)
    var template = HtmlService.createTemplateFromFile('customer_cancellation_confirmation');
    template.bookingID = e.parameter.bookingID;
    return template.evaluate()
      .setTitle('Customer Cancellation Confirmation Page')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    error_message = "Booking ID was not found (maybe wrong ID or current status of the booking cannot be canceled)";
    var template = HtmlService.createTemplateFromFile('customer_cancellation');
    template.error_message = error_message;
    return template.evaluate()
      .setTitle('Customer Cancellation Page')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function handleCustomerProvideBookingFeedback(e) {
  // Open the spreadsheet and get the Booking sheet
  const bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  const bookingRange = bookingSheet.getRange('B5:X');
  const bookingData = bookingRange.getValues();

  const feedbackSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Feedback');

  let error_message = null;
  let currentDateTime = getCurrentDateTime();

  let rowIndex = -1;
  let status = null;
  for (let i = 0; i < bookingData.length; i++) {
    if (bookingData[i][0] === e.parameter.bookingID) { // Assuming bookingId is in column B
      status = bookingData[i][15];
      rowIndex = i;
      break;
    }
  }

  if (rowIndex == -1) {
    error_message = "Booking ID was not found";
    var template = HtmlService.createTemplateFromFile('customer_feedback');
    template.error_message = error_message;
    return template.evaluate()
      .setTitle('Customer Feedback Page')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (status != 'Completed') {
    error_message = "The booking status need to be completed";
    var template = HtmlService.createTemplateFromFile('customer_feedback');
    template.error_message = error_message;
    return template.evaluate()
      .setTitle('Customer Feedback Page')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  let lastRow = feedbackSheet.getLastRow();
  let newFeedbackRow = lastRow + 1;
  feedbackSheet.getRange(newFeedbackRow, 2, 1, 5).setValues([[newFeedbackRow - 4, e.parameter.bookingID, e.parameter.feedback, e.parameter.rating, currentDateTime]]);
  var template = HtmlService.createTemplateFromFile('customer_feedback_confirmation');
  return template.evaluate()
    .setTitle('Customer Feedback Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function autoAssignEmployee(bookingID, bookingDate, startTime, endTime, bookingZoneID, numberEmployee) {
  let employeeZoneSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee_Zone');
  let employeeAppointmentSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee Appointment');
  let bookingSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');

  let employeeZoneData = employeeZoneSheet.getDataRange('B5:C').getValues();
  let employeeAppointmentData = employeeAppointmentSheet.getDataRange('B5:D').getValues();
  let bookingData = bookingSheet.getDataRange('B5:F').getValues();

  let currentDateTime = getCurrentDateTime();

  // Convert times to Date objects for easier comparison
  const bookingDateObj = new Date(bookingDate);
  const startTimeObj = new Date(bookingDate + " " + startTime);
  const endTimeObj = new Date(bookingDate + " " + endTime);

  // 1. Find employees matching the bookingZoneID
  let matchingEmployees = [];
  for (let i = 1; i < employeeZoneData.length; i++) {
    const employeeID = employeeZoneData[i][0];
    const employeeZoneID = employeeZoneData[i][1];
    if (employeeZoneID === bookingZoneID) {
      matchingEmployees.push(employeeID);
    }
  }

  // 2. Check for booking time clashes and get available employees
  let availableEmployees = [];
  for (let i = 0; i < matchingEmployees.length; i++) {
    const employeeID = matchingEmployees[i];

    // Get the employee's bookings
    const employeeBookings = employeeAppointmentData.filter(appointment => appointment[1] === employeeID);

    // Get the details of each booking from the Booking sheet
    const sameDayAppointments = employeeBookings.map(appointment => {
      const bookingDetails = bookingData.find(booking => booking[0] === appointment[0]); // Assuming bookingID is in the first column of Booking sheet
      if (bookingDetails) {
        const existingBookingDate = new Date(bookingDetails[2]); // Assuming bookingDate is in the third column
        if (existingBookingDate.getTime() === bookingDateObj.getTime()) {
          return {
            startTime: new Date(bookingDetails[2] + " " + bookingDetails[3]), // Assuming startTime is in the fourth column
            endTime: new Date(bookingDetails[2] + " " + bookingDetails[4]) // Assuming endTime is in the fifth column
          };
        }
      }
      return null;
    }).filter(booking => booking !== null);

    // Check for time clashes
    let hasClash = false;
    for (let j = 0; j < sameDayAppointments.length; j++) {
      const gapBefore = startTimeObj - sameDayAppointments[j].endTime;
      const gapAfter = sameDayAppointments[j].startTime - endTimeObj;

      if (gapBefore < 3600000 && gapAfter < 3600000) { // Check if there's at least 1 hour gap before or after
        hasClash = true;
        break;
      }
    }

    if (!hasClash) {
      availableEmployees.push(employeeID);
    }
  }
  // 3. Sort available employees by their current number of bookings (ascending)
  availableEmployees.sort((a, b) => {
    const aAppointmentsCount = employeeAppointmentData.filter(appointment => appointment[1] === a).length;
    const bAppointmentsCount = employeeAppointmentData.filter(appointment => appointment[1] === b).length;
    return aAppointmentsCount - bAppointmentsCount;
  });

  // 4. Select the numberEmployee employees with the least bookings
  const selectedEmployees = availableEmployees.slice(0, numberEmployee);

  // 5. Assign the booking to each selected employee
  if (selectedEmployees.length > 0) {
    selectedEmployees.forEach(employeeID => {
      employeeAppointmentSheet.appendRow(['', bookingID, employeeID, currentDateTime]);
    });
    Logger.log('Booking ' + bookingID + ' assigned to employees: ' + selectedEmployees.join(', '));
  } else {
    Logger.log('No suitable employees found for booking ' + bookingID);
  }
}