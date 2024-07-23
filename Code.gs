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
  if (temp == 'user_change_password') {
    return handleUserChangePassword();
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
  } else if (action == 'change_password') {
    return changePassword(e);
  } else {
    return HtmlService.createHtmlOutput('Invalid action').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
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

function handleUserChangePassword() {
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

  var template = HtmlService.createTemplateFromFile('user_change_password');
  template.userDetails = userDetails;
  template.status = '';
  return template.evaluate()
    .setTitle('User Profile')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}