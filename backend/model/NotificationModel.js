const db = require('../config/db');

const Notification = {
  // Create a new notification
  create: (userId, orderItemId, type, title, message, callback) => {
    const sql = `
      INSERT INTO notifications (user_id, order_item_id, type, title, message)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [userId, orderItemId, type, title, message], callback);
  },

  // Get all notifications for a user
  getByUserId: (userId, callback) => {
    const sql = `
      SELECT 
        n.*,
        oi.service_type,
        oi.specific_data,
        DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM notifications n
      LEFT JOIN order_items oi ON n.order_item_id = oi.item_id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Get unread notifications count
  getUnreadCount: (userId, callback) => {
    const sql = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `;
    db.query(sql, [userId], callback);
  },

  // Mark notification as read
  markAsRead: (notificationId, userId, callback) => {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE notification_id = ? AND user_id = ?
    `;
    db.query(sql, [notificationId, userId], callback);
  },

  // Mark all notifications as read for a user
  markAllAsRead: (userId, callback) => {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = ? AND is_read = FALSE
    `;
    db.query(sql, [userId], callback);
  },

  // Delete a notification
  delete: (notificationId, userId, callback) => {
    const sql = `
      DELETE FROM notifications
      WHERE notification_id = ? AND user_id = ?
    `;
    db.query(sql, [notificationId, userId], callback);
  },

  // Delete all notifications for a user
  deleteAll: (userId, callback) => {
    const sql = `
      DELETE FROM notifications
      WHERE user_id = ?
    `;
    db.query(sql, [userId], callback);
  },

  // Helper function to create notification when order is accepted
  createAcceptedNotification: (userId, orderItemId, serviceType, callback) => {
    const title = 'Service Accepted!';
    const message = 'Your service request has been accepted. Please drop the item in the store.';
    Notification.create(userId, orderItemId, 'accepted', title, message, callback);
  },

  // Helper function to create notification when status is updated
  createStatusUpdateNotification: (userId, orderItemId, status, notes, callback) => {
    const statusLabels = {
      'in_progress': 'In Progress',
      'ready_to_pickup': 'Ready to Pick Up',
      'completed': 'Completed',
      'rented': 'Rented',
      'returned': 'Returned'
    };
    
    const title = `Order Status Updated`;
    const message = notes || `Your order status has been updated to: ${statusLabels[status] || status}`;
    Notification.create(userId, orderItemId, 'status_update', title, message, callback);
  },

  // Helper function to create notification for price confirmation
  createPriceConfirmationNotification: (userId, orderItemId, finalPrice, callback) => {
    const title = 'Price Confirmation Required';
    const message = `The final price for your service has been updated to ₱${parseFloat(finalPrice).toLocaleString()}. Please review and confirm.`;
    Notification.create(userId, orderItemId, 'price_confirmation', title, message, callback);
  },

  // Helper function to create appointment reminder notification
  createAppointmentReminderNotification: (userId, orderItemId, appointmentDate, callback) => {
    const title = 'Appointment Reminder';
    const message = `Reminder: Your appointment is tomorrow (${appointmentDate}). Please don't forget!`;
    Notification.create(userId, orderItemId, 'appointment_reminder', title, message, callback);
  }
};

module.exports = Notification;
