var SESSION_KEY = 'userSession';
let user = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('User');
let employee_zone = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Employee_Zone');
let zone = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Zone');


function doGet(e) {
  let temp = 'login';
  if ('temp' in e.parameters) {
    temp = e.parameters['temp'][0];
  }
  if (temp == 'admin_dashboard') {
    return handleAdminDashboard();
  }
  if (temp == 'user_profile') {
    return handleUserProfile();
  }
  if (temp == 'user_change_password') {
    return handleUserChangePassword();
  }
  if (temp == 'admin_service') {
    return handleAdminService();
  }
  if (temp == 'admin_customer') {
    return handleAdminCustomer();
  }
  if (temp == 'admin_employee') {
    return handleAdminEmployee();
  }
  if (temp == 'admin_booking') {
    return handleAdminBooking();
  }
  if (temp == 'admin_payment') {
    return handleAdminPayment();
  }
  if (temp == 'staff_route') {
    return handleStaffRoute();
  }
  if (temp == 'customer_booking') {
    return handleCustomerBooking();
  }
  if (temp == 'customer_cancellation') {
    return handleCustomerCancellation();
  }
  if (temp == 'customer_feedback') {
    return handleCustomerFeedback();
  }
  if (temp == 'employee_tracking_dashboard') {
    return handleStaffDashboard();
  }
  if (temp = 'staff_booking') {
    return handleStaffBooking();
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
  } else if (action == 'add_service') {
    return handleAddService(e);
  } else if (action == 'booking_details') {
    return handleStaffBookingDetails(e);
  } else if (action == 'remain_open') {
    return handleRemainInvoiceOpen(e);
  } else if (action == 'make_booking') {
    return handleCustomerBookService(e);
  } else if (action == 'cancel_booking') {
    return handleCustomerCancelBooking(e);
  } else if (action == 'provide_feedback') {
    return handleCustomerProvideBookingFeedback(e);
  } else if (action == 'tracking_dashboard') {
    return handleEmployeeTrackingDashboard(e);
  } else {
    return HtmlService.createHtmlOutput('Invalid action').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}


function handleStaffDashboard() {
  var template = HtmlService.createTemplateFromFile('employee_tracking_dashboard');
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);
  var userDetails = JSON.parse(userSession);
  var employeeDetails = getEmployeeDashboardData(userDetails.userID);
  template.userDetails = userDetails;
  template.employeeDetails = employeeDetails;
  template.notificationDetails = getNotificationData(userDetails.userID);
  return template.evaluate()
    .setTitle('EzBook')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleAdminDashboard() {
  // Store session token in Properties Service
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);

  var userDetails = JSON.parse(userSession);
  var userId = userDetails.userID;

  var html = HtmlService.createTemplateFromFile('admin_dashboard');
  html.userID = userId;
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

function handleStaffBooking() {
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);
  var userDetails = JSON.parse(userSession);
  var template = HtmlService.createTemplateFromFile('staff_booking');
  template.notificationDetails = getNotificationData(userDetails.userID);
  return template.evaluate()
    .setTitle('Staff Booking')
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
  template.notificationDetails = getNotificationData(userDetails.userID);
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
  template.notificationDetails = getNotificationData(userDetails.userID);
  template.status = '';
  return template.evaluate()
    .setTitle('User Profile')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleAdminService() {
  var template = HtmlService.createTemplateFromFile('admin_service');
  return template.evaluate()
    .setTitle('Service Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleAdminCustomer() {
  var template = HtmlService.createTemplateFromFile('admin_customer');
  return template.evaluate()
    .setTitle('Customer Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleAdminEmployee() {
  var template = HtmlService.createTemplateFromFile('admin_employee');
  return template.evaluate()
    .setTitle('Employee Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleAdminBooking() {
  var template = HtmlService.createTemplateFromFile('admin_booking');
  return template.evaluate()
    .setTitle('Booking Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleAdminPayment() {
  var template = HtmlService.createTemplateFromFile('admin_payment');
  return template.evaluate()
    .setTitle('Payment Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleStaffBookingDetails(e) {
  let bookingId = e.parameter.booking_id;
  let bookingDetails = getFullBookingDetails(bookingId);
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);
  var userDetails = JSON.parse(userSession);
  var template = HtmlService.createTemplateFromFile('staff_view_booking_details');
  template.bookingDetails = bookingDetails;
  template.notificationDetails = getNotificationData(userDetails.userID);
  return template.evaluate()
    .setTitle('Booking Details Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleStaffRoute() {
  let bookingDetails = getTodaysBookings();
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);
  var userDetails = JSON.parse(userSession);
  var template = HtmlService.createTemplateFromFile('staff_route');
  template.bookingDetails = bookingDetails;
  template.notificationDetails = getNotificationData(userDetails.userID);
  return template.evaluate()
    .setTitle('Routing Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleCustomerBooking() {
  var template = HtmlService.createTemplateFromFile('customer_booking');
  var bookingData = {
    name: '',
    contact: '',
    email: '',
    address1: '',
    address2: '',
    postcode: '',
    city: '',
    state: '',
    date: '',
    time: '',
    aircond_type: '',
    service_type: '',
    no_device_service: '',
    remakr: '',
    error_message: '',
  }
  template.bookingData = bookingData;
  return template.evaluate()
    .setTitle('Customer Booking Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleCustomerCancellation() {
  var template = HtmlService.createTemplateFromFile('customer_cancellation');
  template.error_message = '';
  return template.evaluate()
    .setTitle('Customer Cancellation Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleCustomerFeedback() {
  var template = HtmlService.createTemplateFromFile('customer_feedback');
  template.error_message = '';
  return template.evaluate()
    .setTitle('Customer Feedback Page')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleEmployeeTrackingDashboard(e) {
  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);
  var userDetails = JSON.parse(userSession);
  var template = HtmlService.createTemplateFromFile('employee_tracking_dashboard');
  var employeeDetails = getEmployeeDashboardData(e.parameter.userId);
  template.userDetails = userDetails;
  template.employeeDetails = employeeDetails;
  template.notificationDetails = getNotificationData(e.parameter.userID);
  return template.evaluate()
    .setTitle('EzBook')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getCurrentDateTime() {
  // Get current datetime in format YYYY-MM-DD HH:MM:SS
  let currentDateTime = new Date();
  let year = currentDateTime.getFullYear();
  let month = String(currentDateTime.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  let day = String(currentDateTime.getDate()).padStart(2, '0');
  let hours = String(currentDateTime.getHours()).padStart(2, '0');
  let minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
  let seconds = String(currentDateTime.getSeconds()).padStart(2, '0');
  let formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDateTime;
}
