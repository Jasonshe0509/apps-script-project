var SESSION_KEY = 'userSession';

function doGet(e) {
  let temp = 'login';
  if ('temp' in e.parameters) {
    temp = e.parameters['temp'][0];
  }
  try {
    var template = HtmlService.createTemplateFromFile('login');
    template.message = '';
    return template.evaluate().setTitle('EzBook Login Page').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e){
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
  let user = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('User');
  var userData = user.getDataRange().getValues();
  for (let i = 4; i < userData.length; i++) {
    if (userData[i][6] == e.parameter.email && userData[i][3] == e.parameter.password) {
      var role = userData[i][17];
      var redirectPage = 'staff_dashboard';
      if (role == 'Admin') {
        redirectPage = 'admin_dashboard'
      }
      var userDetails = {
        userID: userData[i][1],
        email: userData[i][6],
        name: userData[i][2]
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