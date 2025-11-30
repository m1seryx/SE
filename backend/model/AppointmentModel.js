const db = require('../config/db');

const Appointment = {
  // Create appointment from cart items
  createFromCart: (userId, services, customerInfo, appointmentDate, callback) => {
    const sql = `
      INSERT INTO appointments (user_id, services, customer_info, appointment_date, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `;
    
    const servicesJson = JSON.stringify(services);
    const customerJson = JSON.stringify(customerInfo);
    
    db.query(sql, [userId, servicesJson, customerJson, appointmentDate], callback);
  },

  // Get appointments by user
  getByUser: (userId, callback) => {
    const sql = `
      SELECT 
        a.*,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
        DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM appointments a
      JOIN user u ON a.user_id = u.user_id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Get all appointments (for admin)
  getAll: (callback) => {
    const sql = `
      SELECT 
        a.*,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
        DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM appointments a
      JOIN user u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
    `;
    db.query(sql, callback);
  },

  // Get appointment by ID
  getById: (appointmentId, callback) => {
    const sql = `
      SELECT 
        a.*,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
        DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM appointments a
      JOIN user u ON a.user_id = u.user_id
      WHERE a.id = ?
    `;
    db.query(sql, [appointmentId], callback);
  },

  // Update appointment status
  updateStatus: (appointmentId, status, callback) => {
    const sql = `
      UPDATE appointments 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    db.query(sql, [status, appointmentId], callback);
  },

  // Cancel appointment
  cancelAppointment: (appointmentId, reason = null, callback) => {
    const sql = `
      UPDATE appointments 
      SET status = 'cancelled', cancellation_reason = ?, updated_at = NOW()
      WHERE id = ?
    `;
    db.query(sql, [reason, appointmentId], callback);
  },

  // Delete appointment
  deleteAppointment: (appointmentId, callback) => {
    const sql = `DELETE FROM appointments WHERE id = ?`;
    db.query(sql, [appointmentId], callback);
  },

  // Update appointment
  updateAppointment: (appointmentId, services, customerInfo, appointmentDate, callback) => {
    const sql = `
      UPDATE appointments 
      SET services = ?, customer_info = ?, appointment_date = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const servicesJson = JSON.stringify(services);
    const customerJson = JSON.stringify(customerInfo);
    
    db.query(sql, [servicesJson, customerJson, appointmentDate, appointmentId], callback);
  }
};

module.exports = Appointment;