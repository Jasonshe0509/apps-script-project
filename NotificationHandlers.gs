function getNotificationData(userID) {
  const ss = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE');
  const notificationSheet = ss.getSheetByName('Notification');
  const notificationRange = notificationSheet.getRange('B5:G'); // Adjust to include all relevant columns
  const notifications = notificationRange.getValues();

  const notificationDetails = notifications
    .filter(notification => notification[1] === userID) // Filter notifications by userID
    .map(notification => {
      const createDateTime = new Date(notification[4]);

      let year = createDateTime.getFullYear();
      let month = String(createDateTime.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      let day = String(createDateTime.getDate()).padStart(2, '0');
      let hours = String(createDateTime.getHours()).padStart(2, '0');
      let minutes = String(createDateTime.getMinutes()).padStart(2, '0');
      let date = `${year}-${month}-${day}`;
      let time = `${hours}:${minutes}`;
      return {
        message: notification[2],
        type: notification[3],
        date: date,
        time: time,
        status: notification[5],
      };
    });

  return notificationDetails;
}

function updateNotificationStatus() {
  const ss = SpreadsheetApp.openById('12Fgh9h4M7Zss5KNUPfMVJZjRoE7qFEHed9przexy9zE'); 
  const notificationSheet = ss.getSheetByName('Notification');
  const notificationRange = notificationSheet.getRange('B5:G');
  const notifications = notificationRange.getValues();

  var userProperties = PropertiesService.getUserProperties();
  var userSession = userProperties.getProperty(SESSION_KEY);
  var userDetails = JSON.parse(userSession);

  // Loop through all notifications
  for (let i = 0; i < notifications.length; i++) {
    const notificationUserID = notifications[i][1]; 
    console.log(notificationUserID === userDetails.userID);
    const status = notifications[i][5];

    // Check if the notification is for the specific user and is unread
    if (notificationUserID == userDetails.userID && status == 'Unread') {
      notificationSheet.getRange(i + 5, 7).setValue('Read'); 
    }
  }
}

