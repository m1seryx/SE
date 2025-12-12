// Notification Service - Check for appointment reminders
// This script should be run daily (e.g., via cron job)

const db = require('./config/db');
const Notification = require('./model/NotificationModel');

// Check for appointments tomorrow and send reminders
function checkAppointmentReminders() {
  console.log('Checking for appointment reminders...');
  
  const sql = `
    SELECT 
      oi.item_id as order_item_id,
      oi.appointment_date,
      o.user_id,
      DATE_FORMAT(oi.appointment_date, '%Y-%m-%d') as formatted_date
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.appointment_date IS NOT NULL
      AND DATE(oi.appointment_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND oi.approval_status NOT IN ('cancelled', 'completed', 'price_declined')
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      return;
    }
    
    if (results.length === 0) {
      console.log('No appointments tomorrow');
      return;
    }
    
    console.log(`Found ${results.length} appointments tomorrow`);
    
    results.forEach(item => {
      // Check if reminder notification already exists
      const checkSql = `
        SELECT * FROM notifications
        WHERE order_item_id = ? AND type = 'appointment_reminder'
          AND DATE(created_at) = CURDATE()
      `;
      
      db.query(checkSql, [item.order_item_id], (checkErr, existingNotif) => {
        if (checkErr) {
          console.error('Error checking existing notification:', checkErr);
          return;
        }
        
        // Only create if notification doesn't exist yet for today
        if (!existingNotif || existingNotif.length === 0) {
          // Get service type for better notification message
          const getServiceTypeSql = `SELECT service_type FROM order_items WHERE item_id = ?`;
          db.query(getServiceTypeSql, [item.order_item_id], (serviceErr, serviceResults) => {
            if (serviceErr) {
              console.error('Error fetching service type:', serviceErr);
              return;
            }
            
            const serviceType = (serviceResults[0]?.service_type || 'customize').toLowerCase().trim();
            const dateType = 'sizing'; // For appointments, it's usually sizing
            
            Notification.createPreferredDateReminderNotification(
              item.user_id,
              item.order_item_id,
              item.appointment_date,
              dateType,
              serviceType,
              (notifErr) => {
                if (notifErr) {
                  console.error('Failed to create appointment reminder:', notifErr);
                } else {
                  console.log(`Created reminder for order item ${item.order_item_id}`);
                }
              }
            );
          });
        } else {
          console.log(`Reminder already exists for order item ${item.order_item_id}`);
        }
      });
    });
  });
}

// Run the check
checkAppointmentReminders();

// Close the connection after processing
setTimeout(() => {
  db.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
}, 5000); // Wait 5 seconds for all notifications to be created
