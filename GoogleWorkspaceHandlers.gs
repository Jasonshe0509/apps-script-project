function sendEmail(recipient, subject, body) {
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    from: 'jasonshe80@gmail.com'
  });

  return "Email sent!";
}

function createCalendarInvite(title, startTime, endTime, description, guestEmails) {
  var calendar = CalendarApp.getDefaultCalendar(); // Get the user's default calendar

  try {
    // Create the event with the specified details and guests
    var event = calendar.createEvent(title, startTime, endTime, {
      description: description,
      guests: guestEmails.join(','),
      sendInvites: true
    });

    // Log the event ID
    Logger.log('Event created with ID: ' + event.getId());
  } catch (e) {
    Logger.log('Error creating event: ' + e.toString());
  }
}




