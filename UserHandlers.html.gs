function handleLogin(e) {
  var userData = user.getDataRange().getValues();
  for (let i = 4; i < userData.length; i++) {
    if (userData[i][6] == e.parameter.email && userData[i][3] == e.parameter.password) {

      var role = userData[i][17];
      var redirectPage = 'employee_tracking_dashboard';

      if (role == 'Admin') {
        redirectPage = 'admin_dashboard';
      }

      var city_name = null;
      if (role == 'User') {
        var employeeZoneData = employee_zone.getDataRange().getValues();
        var cityNames = []; // Array to store all city names associated with the employee

        for (let j = 4; j < employeeZoneData.length; j++) {
          if (userData[i][1] == employeeZoneData[j][1]) { // Match userID
            var zoneID = employeeZoneData[j][2];
            var zoneData = zone.getDataRange().getValues();

            for (let k = 4; k < zoneData.length; k++) {
              if (zoneID == zoneData[k][1]) { // Match zoneID
                cityNames.push(zoneData[k][2]); // Add city name to the array
              }
            }
          }
        }

        // Combine city names into a single string, separated by commas
        var city_name = cityNames.join(', ');

      }

      var userDetails = {
        userID: userData[i][1],
        username: userData[i][2],
        user_name: userData[i][4],
        mobile: userData[i][5],
        email: userData[i][6],
        nric: userData[i][7],
        dob: userData[i][8],
        gender: userData[i][9],
        race: userData[i][10],
        role: userData[i][17],
        city_name: city_name
      };

      // Store session token in Properties Service
      var userProperties = PropertiesService.getUserProperties();
      userProperties.setProperty(SESSION_KEY, JSON.stringify(userDetails));

      var html = HtmlService.createTemplateFromFile(redirectPage);
      if (role == 'Admin') {
        html.userID = userData[i][1];
        html.totalSales = getTotalSales();
        html.totalUnpaidAmount = getUnpaidAmounts();
        html.totalPaidAmounts = getPaidAmounts();
        html.totalActiveBookings = getActiveBookings();
        html.bookings = getRecentBookings();
      } else {
        var employeeDetails = getEmployeeDashboardData(userDetails.userID);
        html.userDetails = userDetails;
        html.employeeDetails = employeeDetails;
        html.notificationDetails = getNotificationData(userDetails.userID);
      }

      return html.evaluate()
        .setTitle('EzBook')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  }

  // Handle incorrect credentials
  var template = HtmlService.createTemplateFromFile('login');
  template.message = 'Email or password wrong';
  return template.evaluate()
    .setTitle('EzBook').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleLogout() {
  // Redirect to the login page
  var template = HtmlService.createTemplateFromFile('login');
  template.message = 'You have been logged out';
  return template.evaluate()
    .setTitle('EzBook Login Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function changePassword(e) {
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);

  var userDetails = JSON.parse(userSession);
  var userId = userDetails.userID;
  var oldPassword = e.parameter.oldPassword;
  var newPassword = e.parameter.newPassword;
  var confirmPassword = e.parameter.confirmPassword;

  // Regular expression to validate password: at least one number, one symbol, one uppercase, and one lowercase letter, and at least 8 characters long
  var passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (newPassword != confirmPassword) {
    var template = HtmlService.createTemplateFromFile('user_change_password');
    template.status = "error";
    template.message = 'New password and confirm password does not match';
    template.userDetails = userDetails;

    return template.evaluate()
      .setTitle('User Change Password')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (!passwordRegex.test(newPassword)) {
    var template = HtmlService.createTemplateFromFile('user_change_password');
    template.status = "error";
    template.message = 'New password must contain at least one number, one symbol, one uppercase letter, one lowercase letter, and be at least 8 characters long';
    template.userDetails = userDetails;
    return template.evaluate()
      .setTitle('User Change Password')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var userData = user.getDataRange().getValues();
  for (let i = 4; i < userData.length; i++) {
    if (userData[i][1] == userId) {
      if (userData[i][3] != oldPassword) {
        var template = HtmlService.createTemplateFromFile('user_change_password');
        template.status = "error";
        template.message = 'Old password is incorrect';
        template.userDetails = userDetails;
        return template.evaluate()
          .setTitle('User Change Password')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      } else {
        user.getRange(i + 1, 4).setValue(newPassword);
        var template = HtmlService.createTemplateFromFile('user_change_password');
        template.status = "pass";
        template.message = 'Password changed successfully';
        template.userDetails = userDetails;
        return template.evaluate()
          .setTitle('User Change Password')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
    }
  }

  var template = HtmlService.createTemplateFromFile('user_change_password');
  template.message = 'User not found';
  template.status = "error";
  template.userDetails = userDetails;
  return template.evaluate()
    .setTitle('User Change Password')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getFullEmployeeData() {
  const ss = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const employeeSheet = ss.getSheetByName('User');
  const employeeZoneSheet = ss.getSheetByName('Employee_Zone');
  const zoneSheet = ss.getSheetByName('Zone');

  const employeeRange = employeeSheet.getRange('B5:R'); // Adjust to include all relevant columns
  const employees = employeeRange.getValues();

  // Get Employee Zone data
  const employeeZoneRange = employeeZoneSheet.getRange('B5:C');
  const employeeZones = employeeZoneRange.getValues();

  // Get Zone data
  const zoneRange = zoneSheet.getRange('B5:C');
  const zones = zoneRange.getValues();

  // Create a map for city IDs to city names
  const zoneMap = new Map(zones.map(([cityId, cityName]) => [cityId, cityName]));

  // Create a map for user IDs to arrays of city IDs
  const employeeZoneMap = new Map();
  employeeZones.forEach(([userId, cityId]) => {
    if (!employeeZoneMap.has(userId)) {
      employeeZoneMap.set(userId, []);
    }
    employeeZoneMap.get(userId).push(cityId);
  });

  const updatedEmployees = employees
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
    .map(row => {
      const userId = row[0]; // Assuming user_id is in the first column
      const dob = row[7];
      const cityIds = employeeZoneMap.get(userId) || [];
      const cityNames = cityIds.map(cityId => zoneMap.get(cityId)).join(', ') || '-';
      const formattedDob = dob instanceof Date
        ? Utilities.formatDate(dob, Session.getScriptTimeZone(), 'dd/MM/yyyy')
        : dob;

      // Return the updated employee data excluding the date of birth
      return {
        userId: row[0],
        username: row[1],
        password: row[2],
        fullName: row[3],
        mobileNumber: row[4],
        emailAddress: row[5],
        nric: row[6],
        dob: formattedDob,
        gender: row[8],
        race: row[9],
        address1: row[10],
        address2: row[11],
        postCode: row[12],
        employeeCity: row[13],
        state: row[14],
        country: row[15],
        role: row[16],
        cityName: cityNames
      };
    });

  return updatedEmployees;
}

function getCitiesWithEmployees() {
  const ss = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const citySheet = ss.getSheetByName('Zone');

  const cityRange = citySheet.getRange('B5:D'); // Adjust if headers are in different rows or columns
  const cities = cityRange.getValues();

  const filteredCities = cities.filter(city => city[2] > 0); // Assuming the count of employees is in the third column

  return filteredCities;
}

function getCities() {
  const ss = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const citySheet = ss.getSheetByName('Zone');
  const cityRange = citySheet.getRange('B5:C'); // Adjust range if necessary
  const cities = cityRange.getValues();

  // Filter out rows where the city name (assumed to be in the second column) is empty or null
  const filteredCities = cities.filter(row => row[1] && row[1].trim() !== '');

  return filteredCities;
}

function updateEmployeeCity(userId, oldCityNames, newCityNames) {
  const sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const employeeZoneSheet = sheet.getSheetByName('Employee_Zone');
  const zoneSheet = sheet.getSheetByName('Zone');

  // Get the Employee Zone data
  const employeeZoneRange = employeeZoneSheet.getRange('B5:D');
  const employeeZoneData = employeeZoneRange.getValues();

  // Get the Zone data
  const cityRange = zoneSheet.getRange('B5:D');
  const cityData = cityRange.getValues();

  let currentDateTime = getCurrentDateTime();

  // Split oldCityNames string into an array of city names
  const oldCityNamesArray = oldCityNames.split(',');

  // Variables to store city IDs corresponding to city names
  let oldCityIds = []; // Array to store multiple old city IDs
  let newCityIds = []; // Array to store multiple new city IDs

  // Lookup old city IDs based on the array of old city names
  for (let i = 0; i < oldCityNamesArray.length; i++) {
    for (let j = 0; j < cityData.length; j++) {
      if (cityData[j][1] == oldCityNamesArray[i].trim()) {
        oldCityIds.push(cityData[j][0]);
        break;
      }
    }
  }

  // Lookup new city IDs based on the array of new city names
  for (let i = 0; i < newCityNames.length; i++) {
    for (let j = 0; j < cityData.length; j++) {
      if (cityData[j][1] == newCityNames[i]) {
        newCityIds.push(cityData[j][0]);
        break;
      }
    }
  }

  Logger.log(oldCityIds);
  Logger.log(newCityIds);

  if (oldCityIds.length === 0 || newCityIds.length === 0) {
    throw new Error("Invalid city names provided.");
  }

  let updatedEmployeeZoneData = [];

  for (let i = 0; i < employeeZoneData.length; i++) {
    if (
      employeeZoneData[i][0] != userId ||
      !oldCityIds.includes(employeeZoneData[i][1])
    ) {
      updatedEmployeeZoneData.push(employeeZoneData[i]);
    }
  }

  // Add new city data for the user with currentDateTime
  newCityIds.forEach(cityId => {
    updatedEmployeeZoneData.push([userId, cityId, currentDateTime]);
  });

  // Update the sheet with the new data (including 3 columns: userId, cityId, currentDateTime)
  employeeZoneSheet.getRange(5, 2, updatedEmployeeZoneData.length, 3).setValues(updatedEmployeeZoneData);

  // Update Zone data (increment new city counts and decrement old city count)
  let oldCityRows = [];
  let newCityRows = [];

  for (let i = 0; i < cityData.length; i++) {
    if (oldCityIds.includes(cityData[i][0])) {
      oldCityRows.push(i);
    }
    if (newCityIds.includes(cityData[i][0])) {
      newCityRows.push(i);
    }
  }

  oldCityRows.forEach(row => {
    cityData[row][2] -= 1; // Decrement old city count
  });

  newCityRows.forEach(row => {
    cityData[row][2] += 1; // Increment new city counts
  });

  cityRange.setValues(cityData);
  return { success: true };
}

function getEmployeeData(bookingID) {
  Logger.log(bookingID);
  const employeeAppointmentSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee Appointment');
  const employeeSheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('User');

  var employeeAppointmentData = employeeAppointmentSheet.getRange('B5:C').getValues();
  var employeeData = employeeSheet.getRange('B5:R').getValues();

  var assignedEmployeeIDs = [];
  for (var i = 0; i < employeeAppointmentData.length; i++) {
    if (employeeAppointmentData[i][0] == bookingID) {
      assignedEmployeeIDs.push(employeeAppointmentData[i][1]);
    }
  }

  var availableEmployees = [];
  for (var j = 0; j < employeeData.length; j++) {
    var employeeID = employeeData[j][0];
    var employeeName = employeeData[j][3];

    if (assignedEmployeeIDs.indexOf(employeeID) === -1 && employeeData[j][16] != 'Admin') {
      availableEmployees.push({ id: employeeID, name: employeeName });
    }
  }
  return availableEmployees;
}

function getEmployeeDashboardData(userID) {
  const ss = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const employeeSheet = ss.getSheetByName('User');
  const employeeRange = employeeSheet.getRange('B5:R'); // Adjust to include all relevant columns
  const employees = employeeRange.getValues();

  const employeeZoneSheet = ss.getSheetByName('Employee_Zone');
  // Get Employee Zone data
  const employeeZoneRange = employeeZoneSheet.getRange('B5:C');
  const employeeZones = employeeZoneRange.getValues();

  const zoneSheet = ss.getSheetByName('Zone');
  // Get Zone data
  const zoneRange = zoneSheet.getRange('B5:C');
  const zones = zoneRange.getValues();

  const employeeAppointmentSheet = ss.getSheetByName('Employee Appointment');
  // Get Employee Appointments data
  const employeeAppointmentRange = employeeAppointmentSheet.getRange('B5:C');
  const employeeAppointments = employeeAppointmentRange.getValues();

  const feedbackSheet = ss.getSheetByName('Feedback');
  // Get Feedback data
  const feedbackRange = feedbackSheet.getRange('B5:F'); // Assuming Booking ID is in B and Rating is in C
  const feedbacks = feedbackRange.getValues();

  const invoiceSheet = ss.getSheetByName('Invoice');
  const invoiceRange = invoiceSheet.getRange('B5:G');
  const invoices = invoiceRange.getValues();

  const bookingSheet = ss.getSheetByName('Booking');
  const bookingRange = bookingSheet.getRange('B5:Q');
  const bookings = bookingRange.getValues();


  let employeeName = null;
  let employeeEmail = null;
  let employeeContact = null;

  // Find employee details
  for (var i = 0; i < employees.length; i++) {
    if (employees[i][0] == userID) {
      employeeName = employees[i][3];
      employeeContact = employees[i][4];
      employeeEmail = employees[i][5];
      break; // Stop loop once employee is found
    }
  }

  // Find all city IDs for the given userID
  const cityIDs = employeeZones
    .filter(zone => zone[0] == userID) // Match userID
    .map(zone => zone[1]); // Get city IDs

  // Find city names corresponding to the city IDs
  const cityNames = cityIDs
    .map(cityID => zones.find(zone => zone[0] == cityID)) // Match cityID to get cityName
    .filter(city => city) // Filter out any nulls (if cityID wasn't found)
    .map(city => city[1]) // Extract city name
    .join(', '); // Join city names with comma

  // Get all booking IDs for the given userID
  const bookingIDs = employeeAppointments
    .filter(appointment => appointment[1] == userID) // Match userID to get booking IDs
    .map(appointment => appointment[0]); // Extract booking IDs

  const feedbackDetails = feedbacks
    .filter(feedback => bookingIDs.includes(feedback[1])) // Match booking ID to feedback
    .map(feedback => {
      // Convert the Create Date string to a Date object
      const createDateTime = new Date(feedback[4]);

      let year = createDateTime.getFullYear();
      let month = String(createDateTime.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      let day = String(createDateTime.getDate()).padStart(2, '0');
      let hours = String(createDateTime.getHours()).padStart(2, '0');
      let minutes = String(createDateTime.getMinutes()).padStart(2, '0');
      let date = `${year}-${month}-${day}`;
      let time = `${hours}:${minutes}`;
      return {
        bookingID: feedback[1],
        rating: parseFloat(feedback[3]),
        comments: feedback[2],
        date: date,
        time: time
      };
    });

  // Convert the feedbackDetails to a JSON string
  const feedbackDetailsJson = JSON.stringify(feedbackDetails);

  // Get ratings from Feedback matching the booking IDs
  const ratings = feedbacks
    .filter(feedback => bookingIDs.includes(feedback[1])) // Match booking ID
    .map(feedback => parseFloat(feedback[3])); // Extract ratings as floats

  // Calculate average rating
  const totalRatings = ratings.reduce((sum, rating) => sum + rating, 0);
  const averageRating = ratings.length > 0 ? (totalRatings / ratings.length).toFixed(2) : null;

  // Calculate total payment amount from invoices
  const totalPayment = invoices
    .filter(invoice => bookingIDs.includes(invoice[1])) // Match booking ID to invoices
    .reduce((sum, invoice) => sum + parseFloat(invoice[5]), 0);

  // Get current month and year
  const now = new Date();
  const currentMonth = now.getMonth(); // January is 0, so December is 11
  const currentYear = now.getFullYear();

  // Count total bookings in the current month for this employee
  const currentMonthBookingCount = bookings
    .filter(booking => bookingIDs.includes(booking[0])) // Match booking IDs
    .filter(booking => {
      const bookingDate = new Date(booking[2]);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    })
    .length;

  let customerData = getCustomerData();


  const employeeLatestBooking = bookings
    .filter(booking => bookingIDs.includes(booking[0]))
    .map(booking => {
      let customerDetails = customerData[booking[1]] || { name: 'Unknown Customer' };
      let bookingDate = new Date(booking[2]);
      let startTime = new Date(booking[3]);
      let endTime = new Date(booking[4]);

      let year = bookingDate.getFullYear();
      let month = String(bookingDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      let day = String(bookingDate.getDate()).padStart(2, '0');
      let date = `${year}-${month}-${day}`;
      // Format times to HH:MM
      let formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        bookingID: booking[0],
        status: booking[15],
        customerName: customerDetails.name,
        typeOfService: booking[11],
        scheduleDate: date,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      };
    })
    .sort((a, b) => b.bookingID.localeCompare(a.bookingID)) // Sort in descending order by bookingID
    .slice(0, 3); // Limit to 3 details

  return {
    name: employeeName,
    contact: employeeContact,
    email: employeeEmail,
    city: cityNames,
    rating: averageRating,
    totalPayment: totalPayment,
    bookingCount: currentMonthBookingCount,
    feedbackDetails: feedbackDetailsJson,
    bookingDetails: employeeLatestBooking,
  }
}

