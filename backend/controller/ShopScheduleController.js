const ShopSchedule = require('../model/ShopScheduleModel');

// Get shop schedule (public - users need to know which days are open)
exports.getShopSchedule = (req, res) => {
  ShopSchedule.getAll((err, schedule) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching shop schedule',
        error: err
      });
    }

    // Format schedule for frontend
    const formattedSchedule = schedule.map(item => ({
      day_of_week: item.day_of_week,
      day_name: getDayName(item.day_of_week),
      is_open: item.is_open === 1
    }));

    res.json({
      success: true,
      schedule: formattedSchedule
    });
  });
};

// Get shop schedule (admin only - includes all details)
exports.getShopScheduleAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }

  ShopSchedule.getAll((err, schedule) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching shop schedule',
        error: err
      });
    }

    // Format schedule for frontend
    const formattedSchedule = schedule.map(item => ({
      day_of_week: item.day_of_week,
      day_name: getDayName(item.day_of_week),
      is_open: item.is_open === 1
    }));

    res.json({
      success: true,
      schedule: formattedSchedule
    });
  });
};

// Update shop schedule (admin only)
exports.updateShopSchedule = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }

  const { schedule } = req.body;

  if (!schedule || !Array.isArray(schedule)) {
    return res.status(400).json({
      success: false,
      message: 'Schedule data is required and must be an array'
    });
  }

  // Validate schedule data
  const validSchedule = schedule.map(item => ({
    day_of_week: parseInt(item.day_of_week),
    is_open: item.is_open ? 1 : 0
  }));

  // Ensure all days are present (0-6)
  for (let i = 0; i <= 6; i++) {
    if (!validSchedule.find(s => s.day_of_week === i)) {
      validSchedule.push({ day_of_week: i, is_open: 0 });
    }
  }

  ShopSchedule.updateMultiple(validSchedule, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error updating shop schedule',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Shop schedule updated successfully'
    });
  });
};

// Check if a date is open (public)
exports.checkDateOpen = (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required'
    });
  }

  ShopSchedule.isDateOpen(date, (err, isOpen) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error checking date',
        error: err
      });
    }

    res.json({
      success: true,
      date: date,
      is_open: isOpen
    });
  });
};

// Helper function to get day name
function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

