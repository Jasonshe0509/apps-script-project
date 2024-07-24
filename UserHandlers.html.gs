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
