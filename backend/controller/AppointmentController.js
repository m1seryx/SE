const Appointment = require('../model/AppointmentModel');
const Cart = require('../model/CartModel');

// Submit cart as appointment
exports.submitCart = (req, res) => {
  const userId = req.user.id;
  const { services, customer, date, status } = req.body;

  if (!services || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Services are required" 
    });
  }

  if (!date) {
    return res.status(400).json({ 
      success: false, 
      message: "Appointment date is required" 
    });
  }

  // Create appointment from cart
  Appointment.createFromCart(userId, services, customer || {}, date, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error creating appointment", 
        error: err 
      });
    }

    // Mark cart items as converted to appointment
    const cartItemIds = services.map(service => service.orderId).filter(id => id);
    if (cartItemIds.length > 0) {
      // Update cart items status to 'converted'
      const updatePromises = cartItemIds.map(itemId => {
        return new Promise((resolve, reject) => {
          Cart.updateCartItemStatus(itemId, userId, 'converted', (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      });

      Promise.all(updatePromises)
        .then(() => {
          res.json({
            success: true,
            message: "Appointment created successfully",
            appointmentId: result.insertId
          });
        })
        .catch((error) => {
          console.error('Error updating cart items:', error);
          // Still return success even if cart update fails
          res.json({
            success: true,
            message: "Appointment created successfully",
            appointmentId: result.insertId
          });
        });
    } else {
      res.json({
        success: true,
        message: "Appointment created successfully",
        appointmentId: result.insertId
      });
    }
  });
};

// Get user's appointments
exports.getUserAppointments = (req, res) => {
  const userId = req.user.id;

  Appointment.getByUser(userId, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    // Parse JSON fields for each appointment
    const appointments = results.map(apt => ({
      ...apt,
      services: JSON.parse(apt.services || '[]'),
      customer_info: JSON.parse(apt.customer_info || '{}')
    }));

    res.json({
      success: true,
      message: "Appointments retrieved successfully",
      appointments: appointments
    });
  });
};

// Get all appointments (admin)
exports.getAllAppointments = (req, res) => {
  Appointment.getAll((err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    // Parse JSON fields for each appointment
    const appointments = results.map(apt => ({
      ...apt,
      services: JSON.parse(apt.services || '[]'),
      customer_info: JSON.parse(apt.customer_info || '{}')
    }));

    res.json({
      success: true,
      message: "All appointments retrieved successfully",
      appointments: appointments
    });
  });
};

// Get appointment by ID
exports.getAppointmentById = (req, res) => {
  const appointmentId = req.params.id;
  const userId = req.user.id;

  Appointment.getById(appointmentId, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Appointment not found" 
      });
    }

    const appointment = result[0];
    appointment.services = JSON.parse(appointment.services || '[]');
    appointment.customer_info = JSON.parse(appointment.customer_info || '{}');

    // Check if user owns this appointment (unless admin)
    if (req.user.role !== 'admin' && appointment.user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    res.json({
      success: true,
      message: "Appointment retrieved successfully",
      appointment: appointment
    });
  });
};

// Update appointment status
exports.updateAppointmentStatus = (req, res) => {
  const appointmentId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ 
      success: false, 
      message: "Status is required" 
    });
  }

  // Check if appointment exists and user has permission
  Appointment.getById(appointmentId, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Appointment not found" 
      });
    }

    const appointment = result[0];

    // Check permissions
    if (req.user.role !== 'admin' && appointment.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    Appointment.updateStatus(appointmentId, status, (err, updateResult) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error updating appointment", 
          error: err 
        });
      }

      res.json({
        success: true,
        message: "Appointment status updated successfully"
      });
    });
  });
};

// Cancel appointment
exports.cancelAppointment = (req, res) => {
  const appointmentId = req.params.id;
  const { reason } = req.body;

  // Check if appointment exists and user has permission
  Appointment.getById(appointmentId, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Database error", 
        error: err 
      });
    }

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Appointment not found" 
      });
    }

    const appointment = result[0];

    // Check permissions
    if (req.user.role !== 'admin' && appointment.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    Appointment.cancelAppointment(appointmentId, reason, (err, cancelResult) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error cancelling appointment", 
          error: err 
        });
      }

      res.json({
        success: true,
        message: "Appointment cancelled successfully"
      });
    });
  });
};

// Delete appointment (admin only)
exports.deleteAppointment = (req, res) => {
  const appointmentId = req.params.id;

  // Only admins can delete appointments
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admin only." 
    });
  }

  Appointment.deleteAppointment(appointmentId, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error deleting appointment", 
        error: err 
      });
    }

    res.json({
      success: true,
      message: "Appointment deleted successfully"
    });
  });
};