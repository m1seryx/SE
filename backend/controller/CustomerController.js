const User = require('../model/UserModel');
const CustomerMeasurements = require('../model/CustomerMeasurementsModel');

// Get all customers
exports.getAllCustomers = (req, res) => {
  User.getAllCustomers((err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching customers",
        error: err
      });
    }

    res.json({
      success: true,
      message: "Customers retrieved successfully",
      customers: results
    });
  });
};

// Get customer by ID
exports.getCustomerById = (req, res) => {
  const { id } = req.params;

  User.getCustomerById(id, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching customer",
        error: err
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Get measurements for this customer
    CustomerMeasurements.getByCustomerId(id, (measErr, measurements) => {
      if (measErr) {
        console.error('Error fetching measurements:', measErr);
      }

      res.json({
        success: true,
        message: "Customer retrieved successfully",
        customer: results[0],
        measurements: measurements && measurements.length > 0 ? measurements[0] : null
      });
    });
  });
};

// Update customer
exports.updateCustomer = (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone_number, status } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, and email are required"
    });
  }

  User.updateCustomer(id, first_name, last_name, email, phone_number, status || 'active', (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error updating customer",
        error: err
      });
    }

    res.json({
      success: true,
      message: "Customer updated successfully"
    });
  });
};

// Update customer status
exports.updateCustomerStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Valid status (active/inactive) is required"
    });
  }

  User.updateStatus(id, status, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error updating customer status",
        error: err
      });
    }

    res.json({
      success: true,
      message: "Customer status updated successfully"
    });
  });
};

// Save customer measurements
exports.saveMeasurements = (req, res) => {
  const { id } = req.params;
  const { top, bottom, notes } = req.body;

  CustomerMeasurements.upsert(id, { top, bottom, notes }, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error saving measurements",
        error: err
      });
    }

    res.json({
      success: true,
      message: "Measurements saved successfully"
    });
  });
};

// Get customer measurements
exports.getMeasurements = (req, res) => {
  const { id } = req.params;

  CustomerMeasurements.getByCustomerId(id, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching measurements",
        error: err
      });
    }

    res.json({
      success: true,
      message: "Measurements retrieved successfully",
      measurements: results && results.length > 0 ? results[0] : null
    });
  });
};

