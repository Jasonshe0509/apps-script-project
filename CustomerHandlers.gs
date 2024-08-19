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

                bookingSheet.getRange(newBookingRow, 2, 1, 20).setValues([[newBookingID, customerID, e.parameter.date, e.parameter.time, endTime, e.parameter.address1, e.parameter.address2, e.parameter.postcode, cityID, e.parameter.state, 'Malaysia', e.parameter.service_type, e.parameter.service_type, e.parameter.no_device_service, e.parameter.remark, 'Scheduled', '', '', '', currentDateTime]]);

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

