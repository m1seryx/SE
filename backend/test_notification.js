const Notification = require('./model/NotificationModel');

// Test creating a notification
console.log('Testing notification creation...');

// Test data
const userId = 1; // Assuming user ID 1 exists
const orderItemId = 1; // Assuming order item ID 1 exists
const serviceType = 'repair';

console.log('Creating accepted notification...');
Notification.createAcceptedNotification(userId, orderItemId, serviceType, (err, result) => {
  if (err) {
    console.error('Error creating accepted notification:', err);
    process.exit(1);
  }
  
  console.log('Accepted notification created successfully:', result);
  
  // Now test fetching notifications
  console.log('Fetching notifications for user:', userId);
  Notification.getByUserId(userId, (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      process.exit(1);
    }
    
    console.log('Notifications fetched:', results);
    process.exit(0);
  });
});