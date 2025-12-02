const db = require('../config/db');

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function mapStatus(status, orderStatus) {
  const raw = (status || orderStatus || '').toLowerCase();
  if (!raw) {
    return { status: 'pending', statusText: 'Pending' };
  }
  if (raw.includes('cancel')) {
    return { status: 'cancelled', statusText: 'Cancelled' };
  }
  if (raw.includes('return')) {
    return { status: 'returned', statusText: 'Returned' };
  }
  if (raw.includes('complete')) {
    return { status: 'completed', statusText: 'Completed' };
  }
  if (raw.includes('ready')) {
    return { status: 'pickup', statusText: 'To Pick up' };
  }
  if (raw.includes('rent') || raw === 'rented') {
    return { status: 'rented', statusText: 'Rented' };
  }
  if (raw.includes('progress') || raw.includes('confirm') || raw.includes('pending')) {
    return { status: 'in-progress', statusText: 'In Progress' };
  }
  return { status: raw, statusText: raw.charAt(0).toUpperCase() + raw.slice(1) };
}

function mapService(serviceType) {
  const type = (serviceType || '').toLowerCase();
  if (type === 'rental') return 'Rental';
  if (type === 'repair') return 'Repair';
  if (type === 'customize' || type === 'customization') return 'Customization';
  if (type.includes('dry')) return 'Dry Cleaning';
  return serviceType || 'Service';
}

exports.getDashboardOverview = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }

  try {
    // Add better error handling for each query
    const todayAppointmentsQuery = query(
      `SELECT COUNT(*) AS count 
       FROM appointments 
       WHERE DATE(appointment_date) = CURDATE()`
    ).catch(err => {
      console.error('Error in todayAppointmentsQuery:', err);
      return [{ count: 0 }];
    });

    const yesterdayAppointmentsQuery = query(
      `SELECT COUNT(*) AS count 
       FROM appointments 
       WHERE DATE(appointment_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
    ).catch(err => {
      console.error('Error in yesterdayAppointmentsQuery:', err);
      return [{ count: 0 }];
    });

    const pendingOrdersQuery = query(
      `SELECT COUNT(*) AS count 
       FROM orders 
       WHERE status = 'pending'`
    ).catch(err => {
      console.error('Error in pendingOrdersQuery:', err);
      return [{ count: 0 }];
    });

    const todayRevenueQuery = query(
      `SELECT COALESCE(SUM(oi.final_price), 0) AS total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.payment_status = 'paid'
         AND DATE(o.order_date) = CURDATE()`
    ).catch(err => {
      console.error('Error in todayRevenueQuery:', err);
      return [{ total: 0 }];
    });

    const yesterdayRevenueQuery = query(
      `SELECT COALESCE(SUM(oi.final_price), 0) AS total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.payment_status = 'paid'
         AND DATE(o.order_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
    ).catch(err => {
      console.error('Error in yesterdayRevenueQuery:', err);
      return [{ total: 0 }];
    });

    const currentMonthRevenueQuery = query(
      `SELECT COALESCE(SUM(oi.final_price), 0) AS total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.payment_status = 'paid'
         AND YEAR(o.order_date) = YEAR(CURDATE())
         AND MONTH(o.order_date) = MONTH(CURDATE())`
    ).catch(err => {
      console.error('Error in currentMonthRevenueQuery:', err);
      return [{ total: 0 }];
    });

    const previousMonthRevenueQuery = query(
      `SELECT COALESCE(SUM(oi.final_price), 0) AS total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE oi.payment_status = 'paid'
         AND YEAR(o.order_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND MONTH(o.order_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
    ).catch(err => {
      console.error('Error in previousMonthRevenueQuery:', err);
      return [{ total: 0 }];
    });

    const recentActivityQuery = query(
      `SELECT 
         oi.item_id,
         oi.service_type,
         oi.approval_status,
         o.status AS order_status,
         o.order_date,
         u.first_name,
         u.last_name
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       JOIN user u ON o.user_id = u.user_id
       ORDER BY o.order_date DESC, oi.item_id DESC
       LIMIT 10`
    ).catch(err => {
      console.error('Error in recentActivityQuery:', err);
      return [];
    });

    // Wait for all queries to complete
    const [
      todayAppointmentsRows,
      yesterdayAppointmentsRows,
      pendingOrdersRows,
      todayRevenueRows,
      yesterdayRevenueRows,
      currentMonthRevenueRows,
      previousMonthRevenueRows,
      recentActivityRows
    ] = await Promise.all([
      todayAppointmentsQuery,
      yesterdayAppointmentsQuery,
      pendingOrdersQuery,
      todayRevenueQuery,
      yesterdayRevenueQuery,
      currentMonthRevenueQuery,
      previousMonthRevenueQuery,
      recentActivityQuery
    ]);

    const todaysAppointments = todayAppointmentsRows[0]?.count || 0;
    const yesterdayAppointments = yesterdayAppointmentsRows[0]?.count || 0;
    const apptDiff = todaysAppointments - yesterdayAppointments;
    const apptInfo =
      yesterdayAppointments === 0
        ? ''
        : `${apptDiff >= 0 ? '+' : ''}${apptDiff} from yesterday`;

    const pendingOrders = pendingOrdersRows[0]?.count || 0;
    const pendingInfo =
      pendingOrders === 0 ? '' : `${pendingOrders} awaiting processing`;

    const todayRevenue = Number(todayRevenueRows[0]?.total || 0);
    const yesterdayRevenue = Number(yesterdayRevenueRows[0]?.total || 0);
    const revenueDiff = todayRevenue - yesterdayRevenue;
    const revenueInfo =
      yesterdayRevenue === 0
        ? ''
        : `${revenueDiff >= 0 ? '+' : ''}₱${Math.abs(revenueDiff).toFixed(2)} vs yesterday`;

    const currentMonthRevenue = Number(currentMonthRevenueRows[0]?.total || 0);
    const previousMonthRevenue = Number(previousMonthRevenueRows[0]?.total || 0);
    let growthPercent = 0;
    if (previousMonthRevenue > 0) {
      growthPercent = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    }

    const stats = [
      {
        title: "Today's Appointments",
        number: String(todaysAppointments),
        info: apptInfo
      },
      {
        title: 'Pending Orders',
        number: String(pendingOrders),
        info: pendingInfo
      },
      {
        title: 'Daily Revenue',
        number: `₱${todayRevenue.toFixed(2)}`,
        info: revenueInfo
      },
      {
        title: 'Monthly Growth',
        number: `${growthPercent.toFixed(0)}%`,
        info: 'Compared to last month'
      }
    ];

    const recentActivities = recentActivityRows.map(row => {
      const mappedStatus = mapStatus(row.approval_status, row.order_status);
      const orderDate = row.order_date instanceof Date
        ? row.order_date
        : new Date(row.order_date);
      return {
        customer: `${row.first_name} ${row.last_name}`,
        service: mapService(row.service_type),
        status: mappedStatus.status,
        statusText: mappedStatus.statusText,
        time: formatTimeAgo(orderDate)
      };
    });

    res.json({
      success: true,
      stats,
      recentActivities
    });
  } catch (err) {
    console.error('Error fetching admin dashboard data:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data: ' + err.message
    });
  }
};