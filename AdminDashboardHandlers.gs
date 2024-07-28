function getTotalSales() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let dataRange = sheet.getRange('G5:G'); // Adjust the range to where payment amounts are located
  let data = dataRange.getValues();

  let totalSales = data.reduce((sum, row) => {
    let value = parseFloat(row[0]);
    return !isNaN(value) ? sum + value : sum;
  }, 0);

  return totalSales;
}

function getUnpaidAmounts() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let dataRange = sheet.getRange('G5:H'); // Adjust range as needed
  let data = dataRange.getValues();

  let totalUnpaidAmount = 0;

  data.forEach(row => {
    let paymentAmount = parseFloat(row[0]);
    let paidAmount = parseFloat(row[1]);
    // Check if Payment Amount and Paid Amount are valid numbers
    if (!isNaN(paymentAmount) && (isNaN(paidAmount))) {
      totalUnpaidAmount += paymentAmount;
    }
    if (!isNaN(paymentAmount) && (!isNaN(paidAmount) || paidAmount === 0)) {
      // Calculate the unpaid amount (Payment Amount - Paid Amount)
      if (paymentAmount > paidAmount) {
        totalUnpaidAmount += (paymentAmount - paidAmount);
      }
    }
  });

  return totalUnpaidAmount;
}

function getPaidAmounts() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Invoice');
  let dataRange = sheet.getRange('H5:H'); // Adjust the range to where payment amounts are located
  let data = dataRange.getValues();

  let totalPaidAmounts = data.reduce((sum, row) => {
    let value = parseFloat(row[0]);
    return !isNaN(value) ? sum + value : sum;
  }, 0);

  return totalPaidAmounts;
}

function getActiveBookings() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking'); // Adjust sheet name as needed
  let dataRange = sheet.getRange('R2:R'); // Adjust range to include booking status column
  let data = dataRange.getValues();

  let countActive = 0;

  data.forEach(row => {
    let status = row[0].trim(); // Trim any extra spaces

    // Check if the status is neither "Completed" nor "Canceled" and is not empty
    if (status && status !== 'Completed' && status !== 'Canceled') {
      countActive++;
    }
  });

  return countActive;
}

function getCityData() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Zone'); // Adjust sheet name as needed
  let dataRange = sheet.getRange('B5:C'); // Adjust range to include City ID and City Name columns
  let data = dataRange.getValues();

  let cityMap = {};
  data.forEach(row => {
    let cityId = row[0];
    let cityName = row[1];
    if (cityId) {
      cityMap[cityId] = cityName;
    }
  });

  return cityMap;
}


function getTodaysBookings() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking'); // Adjust sheet name as needed
  let customerData = getCustomerData(); // Fetch customer data
  let cityData = getCityData(); // Fetch city data
  let dataRange = sheet.getRange('B5:K'); // Adjust range to include all relevant columns
  let data = dataRange.getValues();

  let todaysDate = new Date();
  todaysDate.setHours(0, 0, 0, 0); // Set time to start of day
  let endOfDay = new Date(todaysDate);
  endOfDay.setHours(23, 59, 59, 999); // Set time to end of day

  let bookings = [];

  data.forEach(row => {
    let bookingDate = new Date(row[2]); // Adjust index if necessary
    let customerId = row[1]; // Adjust index for Customer ID
    let cityId = row[8]; // Adjust index for City ID
    let startTime = new Date(row[3]);
    let endTime = new Date(row[4]);
    let address1 = row[5];
    let address2 = row[6];
    let customerDetails = customerData[customerId] || 'Unknown'; // Look up customer name
    let cityName = cityData[cityId] || 'Unknown'; // Look up city name
    let address = address2 ? `${address1}, ${address2}` : address1;

    // Format times to HH:MM
    let formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (bookingDate >= todaysDate && bookingDate <= endOfDay) {
      bookings.push({
        id: row[0],
        customerName: customerDetails.name,
        customerMobile: customerDetails.mobile,
        address: `${address}, ${cityName}`,
        time: `${formattedStartTime} - ${formattedEndTime}`,
        startTime: startTime // Include startTime for sorting purposes
      });
    }
  });

  // Sort bookings by start time
  bookings.sort((a, b) => a.startTime - b.startTime);

  // Remove startTime from the final result
  bookings = bookings.map(booking => {
    delete booking.startTime;
    return booking;
  });

  return bookings;
}

function getRecentBookings() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Booking');
  let customerData = getCustomerData();
  let dataRange = sheet.getRange('B5:Q'); // Adjust range to include all relevant columns
  let data = dataRange.getValues();

  let bookings = [];

  data.forEach(row => {
    let bookingId = row[0];
    let status = row[15];
    let customerId = row[1];
    let typeOfService = row[11];

    // Skip rows with empty booking IDs
    if (!bookingId || bookingId.trim() === '') {
      return;
    }

    // Get customer name from the customer sheet
    let customerDetails = customerData[customerId] || 'Unknown Customer';

    bookings.push({
      bookingId: bookingId,
      status: status,
      customerName: customerDetails.name,
      typeOfService: typeOfService
    });
  });

  // Sort bookings by the numeric part of booking ID in descending order
  bookings.sort((a, b) => {
    let numA = parseInt(a.bookingId.replace(/BK/, ''), 10);
    let numB = parseInt(b.bookingId.replace(/BK/, ''), 10);
    return numB - numA;
  });

  // Log sorted bookings for debugging
  Logger.log('Sorted Bookings: ' + JSON.stringify(bookings));

  // Limit to 6 entries
  bookings = bookings.slice(0, 6);

  // Log final bookings for debugging
  Logger.log('Final Bookings: ' + JSON.stringify(bookings));

  return bookings;
}






