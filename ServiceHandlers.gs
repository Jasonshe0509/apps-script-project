function getServiceTypeData() {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Service');
  var dataRange = sheet.getRange('B5:F'); // Adjusted to get the right range
  var data = dataRange.getValues();

  // Filter out rows where all cells are empty
  var filteredData = data.filter(function (row) {
    return row.some(cell => cell !== '' && cell !== null && cell !== undefined);
  });

  return filteredData;
}

function handleAddService(e) {
  // Open the Google Spreadsheet and get the Service sheet
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Service');

  // Get all values in the ID column (assuming column B)
  let idColumn = sheet.getRange('B5:B').getValues().flat();

  // Filter out any empty cells and convert to numbers
  let ids = idColumn.filter(String).map(Number);

  // Find the highest ID and increment it
  let newId = Math.max(...ids) + 1;

  // Get form parameters
  let serviceName = e.parameter.serviceName;
  let serviceDescription = e.parameter.serviceDescription;
  let numberOfEmployee = e.parameter.numberOfEmployee;
  let estimatedTime = e.parameter.estimatedTime;
  let formattedDateTime = getCurrentDateTime();

  // Add new row of data
  sheet.appendRow([
    '',  // Column A will be left empty
    newId,  // Column B for ID
    serviceName,  // Column C for serviceName
    serviceDescription,  // Column D for serviceDescription
    numberOfEmployee,  // Column E for numberOfEmployee
    estimatedTime,  // Column F for estimatedTime
    formattedDateTime,
    formattedDateTime
  ]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }));
}

function handleUpdateService(serviceId, serviceData) {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Service');
  const range = sheet.getDataRange(); // Get the range of all data in the sheet
  const values = range.getValues(); // Get all values as a 2D array
  let formattedDateTime = getCurrentDateTime();

  // Find the row that matches the serviceId
  let rowIndex = -1;
  for (let i = 4; i < values.length; i++) {
    if (values[i][1] == serviceId) { // Assuming ID is in the first column
      rowIndex = i + 1; // Row numbers in Sheets are 1-based
      break;
    }
  }

  if (rowIndex !== -1) {
    // Update the row with the new service details
    sheet.getRange(rowIndex, 3).setValue(serviceData.serviceName);
    sheet.getRange(rowIndex, 4).setValue(serviceData.serviceDescription);
    sheet.getRange(rowIndex, 5).setValue(serviceData.numberOfEmployee);
    sheet.getRange(rowIndex, 6).setValue(serviceData.estimatedTime);
    sheet.getRange(rowIndex, 8).setValue(formattedDateTime);
    return { success: true };
  } else {
    return { success: false, message: 'Service ID not found.' };
  }
}

function handleDeleteService(serviceId) {
  let sheet = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE').getSheetByName('Service');
  const range = sheet.getDataRange(); // Get the range of all data in the sheet
  const values = range.getValues(); // Get all values as a 2D array

  // Find the row that matches the serviceId
  let rowIndex = -1;
  for (let i = 4; i < values.length; i++) {
    if (values[i][1] == serviceId) { // Assuming ID is in the first column
      rowIndex = i + 1; // Row numbers in Sheets are 1-based
      break;
    }
  }
  Logger.log(rowIndex);
  if (rowIndex != -1) {
    // Delete the row from the sheet
    sheet.deleteRow(rowIndex);
    return { success: true };
  } else {
    return { success: false, message: 'Service ID not found.' };
  }
}

