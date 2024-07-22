var SESSION_KEY = 'userSession';
let user = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('User');
let employee_zone = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee_Zone');
let zone = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Zone');

function doGet(e) {
  let temp = 'login';
  if ('temp' in e.parameters) {
    temp = e.parameters['temp'][0];
  }
  if (temp == 'user_profile') {
    return handleUserProfile();
  }
  try {
    var template = HtmlService.createTemplateFromFile('login');
    template.message = '';
    return template.evaluate().setTitle('EzBook Login Page').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(e))
  }

}

function getUrl() {
  return ScriptApp.getService().getUrl();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doPost(e) {
  let action = e.parameter.action;

  if (action == 'login') {
    return handleLogin(e);
  } else if (action == 'logout') {
    return handleLogout();
  } else {
    return HtmlService.createHtmlOutput('Invalid action').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

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

function handleUserProfile() {
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);

  if (!userSession) {
    // If no user session, redirect to login page
    var template = HtmlService.createTemplateFromFile('login');
    template.message = 'Please log in first';
    return template.evaluate()
      .setTitle('EzBook Login Page')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var userDetails = JSON.parse(userSession);

  var template = HtmlService.createTemplateFromFile('user_profile');
  template.userDetails = userDetails;
  return template.evaluate()
    .setTitle('User Profile')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}