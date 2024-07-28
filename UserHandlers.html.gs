function handleLogin(e) {
  var userData = user.getDataRange().getValues();
  for (let i = 4; i < userData.length; i++) {
    if (userData[i][6] == e.parameter.email && userData[i][3] == e.parameter.password) {
      var role = userData[i][17];
      var redirectPage = 'staff_dashboard';
      if (role == 'Admin') {
        redirectPage = 'admin_dashboard'
      }
      var employeeZoneData = employee_zone.getDataRange().getValues();
      for (let j = 4; j < employeeZoneData.length; j++) {
        if (userData[i][1] == employeeZoneData[j][1]) {
          var zoneID = employeeZoneData[j][2];
          var zoneData = zone.getDataRange().getValues();
          for (let k = 4; k < zoneData.length; k++) {
            if (zoneID == zoneData[k][1]) {
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
                city_name: zoneData[k][2]
              };

              // Store session token in Properties Service
              var userProperties = PropertiesService.getUserProperties();
              userProperties.setProperty(SESSION_KEY, JSON.stringify(userDetails));

              var html = HtmlService.createTemplateFromFile(redirectPage);
              html.userID = userData[i][1];
              html.totalSales = getTotalSales();
              html.totalUnpaidAmount = getUnpaidAmounts();
              html.totalPaidAmounts = getPaidAmounts();
              html.totalActiveBookings = getActiveBookings();
              html.bookings = getRecentBookings();
              return html.evaluate()
                .setTitle('EzBook')
                .addMetaTag('viewport', 'width=device-width, initial-scale=1')
                .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
            }
          }
        }
      }
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

  // Get customer data
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

  // Create a map for user IDs to city IDs
  const employeeZoneMap = new Map(employeeZones.map(([userId, cityId]) => [userId, cityId]));


  const updatedEmployees = employees
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
    .map(row => {
      const userId = row[0]; // Assuming user_id is in the first column
      const dob = row[7];
      const cityId = employeeZoneMap.get(userId);
      const cityName = cityId ? zoneMap.get(cityId) : 'Unknown City';
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
        cityName: cityName
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

function updateEmployeeCity(userId, oldCityName, newCityName) {
  const sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const employeeZoneSheet = sheet.getSheetByName('Employee_Zone');
  const zoneSheet = sheet.getSheetByName('Zone');

  // Get the Employee Zone data
  const employeeZoneRange = employeeZoneSheet.getRange('B5:C');
  const employeeZoneData = employeeZoneRange.getValues();

  // Get the Zone data
  const cityRange = zoneSheet.getRange('B5:D');
  const cityData = cityRange.getValues();

  // Variables to store city IDs corresponding to city names
  let oldCityId = null;
  let newCityId = null;

  // Lookup city IDs based on city names
  for (let i = 0; i < cityData.length; i++) {
    if (cityData[i][1] == oldCityName) {
      oldCityId = cityData[i][0];
    }
    if (cityData[i][1] == newCityName) {
      newCityId = cityData[i][0];
    }
  }

  if (oldCityId === null || newCityId === null) {
    throw new Error("Invalid city names provided.");
  }

  // Update Employee Zone data and find rows for cities
  for (let i = 0; i < employeeZoneData.length; i++) {
    if (employeeZoneData[i][0] == userId) {
      // Update the city ID for the specified user
      employeeZoneData[i][1] = newCityId;
    }
  }
  employeeZoneRange.setValues(employeeZoneData);


  // // Update Zone data
  let oldCityRow = -1;
  let newCityRow = -1;
  for (let i = 0; i < cityData.length; i++) {
    if (cityData[i][0] === oldCityId) {
      oldCityRow = i;
    }
    if (cityData[i][0] === newCityId) {
      newCityRow = i;
    }
  }

  if (oldCityRow !== -1) {
    cityData[oldCityRow][2] -= 1; // Decrement old city count
  }

  if (newCityRow !== -1) {
    cityData[newCityRow][2] += 1; // Increment new city count
  }

  cityRange.setValues(cityData);
  return { success: true };
}


