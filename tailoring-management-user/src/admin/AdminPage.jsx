import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../adminStyle/admin.css';
import AdminHeader from './AdminHeader';
import { getAdminDashboardOverview } from '../api/AdminDashboardApi';

function AdminPage() {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminDashboardOverview();
        if (data?.success) {
          setStats(data.stats || []);
          setAllActivities(data.recentActivities || []);
          setRecentActivities(data.recentActivities || []);
        } else {
          setError(data.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
        setError('An unexpected error occurred while loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Filter activities based on selected filters
  useEffect(() => {
    let filtered = [...allActivities];

    // Filter by service type
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(activity => {
        const service = activity.service?.toLowerCase() || '';
        const filter = serviceFilter.toLowerCase();
        return service.includes(filter) || 
               (filter === 'dry' && service.includes('dry')) ||
               (filter === 'custom' && (service.includes('custom') || service.includes('customize')));
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => {
        if (statusFilter === 'payment') {
          return activity.isPayment === true || activity.actionType === 'payment';
        }
        const status = activity.status?.toLowerCase() || '';
        const statusText = activity.statusText?.toLowerCase() || '';
        const filter = statusFilter.toLowerCase();
        return status === filter || statusText.includes(filter);
      });
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(activity => {
        // Parse time string (e.g., "2 hours ago", "3 days ago")
        const timeStr = activity.time || '';
        if (timeStr.includes('Just now') || timeStr.includes('minute')) {
          return dateFilter === 'today';
        }
        if (timeStr.includes('hour')) {
          return dateFilter === 'today' || dateFilter === 'week';
        }
        if (timeStr.includes('day')) {
          const daysMatch = timeStr.match(/(\d+)\s+day/);
          if (daysMatch) {
            const days = parseInt(daysMatch[1]);
            if (dateFilter === 'today') return days === 0;
            if (dateFilter === 'week') return days <= 7;
            if (dateFilter === 'month') return days <= 30;
          }
        }
        return true;
      });
    }

    setRecentActivities(filtered);
  }, [serviceFilter, statusFilter, dateFilter, allActivities]);

  return (
    <div className="admin-page">
      <Sidebar />
      <AdminHeader />
      
      <div className="content">
        <div className="dashboard-title">
          <h2>Dashboard Overview</h2>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '500', fontSize: '14px' }}>Service:</label>
            <select 
              value={serviceFilter} 
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Services</option>
              <option value="repair">Repair</option>
              <option value="dry">Dry Cleaning</option>
              <option value="custom">Customization</option>
              <option value="rental">Rental</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '500', fontSize: '14px' }}>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="payment">💳 Payments</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '500', fontSize: '14px' }}>Date:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {(serviceFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setServiceFilter('all');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '5px',
                border: '1px solid #dc3545',
                backgroundColor: '#fff',
                color: '#dc3545',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        <div className="stats-grid">
          {loading && stats.length === 0 ? (
            <div className="stat-card">
              <h3>Loading dashboard...</h3>
            </div>
          ) : (
            stats.map((stat, index) => (
              <div className="stat-card" key={index}>
                <h3 className={stat.title === 'Monthly Revenue' ? 'small-revenue' : ''}>{stat.number}</h3>
                <p>{stat.title}</p>
                {stat.info && <small>{stat.info}</small>}
              </div>
            ))
          )}
        </div>

        <div className="recent-activity">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type of Service</th>
                <th>Status / Payment</th>
                <th>Details / Payment Record</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-cell">
                    Loading recent activities...
                  </td>
                </tr>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <tr key={index}>
                    <td className="customer">{activity.customer}</td>
                    <td>{activity.service}</td>
                    <td>
                      {activity.isPayment ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`status ${activity.paymentInfo?.payment_status || activity.status}`} style={{ 
                            backgroundColor: activity.paymentInfo?.payment_status === 'paid' || activity.paymentInfo?.payment_status === 'fully_paid' 
                              ? '#d4edda' 
                              : activity.paymentInfo?.payment_status === 'down-payment'
                              ? '#fff3cd'
                              : '#f8d7da',
                            color: activity.paymentInfo?.payment_status === 'paid' || activity.paymentInfo?.payment_status === 'fully_paid'
                              ? '#155724'
                              : activity.paymentInfo?.payment_status === 'down-payment'
                              ? '#856404'
                              : '#721c24',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            💳 Payment: {activity.paymentInfo?.payment_status === 'paid' ? 'Paid' : 
                                         activity.paymentInfo?.payment_status === 'fully_paid' ? 'Fully Paid' :
                                         activity.paymentInfo?.payment_status === 'down-payment' ? 'Down Payment' :
                                         activity.paymentInfo?.payment_status === 'partial_payment' ? 'Partial Payment' :
                                         activity.paymentInfo?.payment_status || 'Payment'}
                          </span>
                          {activity.paymentInfo?.amount && (
                            <span style={{ fontSize: '11px', color: '#28a745', fontWeight: 'bold' }}>
                              Amount: ₱{parseFloat(activity.paymentInfo.amount).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`status ${activity.status}`}>
                          {activity.statusText}
                        </span>
                      )}
                    </td>
                    <td style={{ 
                      color: activity.reason || activity.notes ? '#666' : '#999', 
                      fontStyle: activity.reason || activity.notes ? 'normal' : 'italic',
                      maxWidth: '200px',
                      wordWrap: 'break-word',
                      fontSize: activity.isPayment ? '12px' : '14px'
                    }}>
                      {activity.isPayment ? (
                        <div>
                          {activity.notes && (
                            <div style={{ marginBottom: '4px' }}>{activity.notes}</div>
                          )}
                          {activity.paymentInfo?.payment_method && (
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              Method: {activity.paymentInfo.payment_method}
                            </div>
                          )}
                        </div>
                      ) : (
                        activity.reason || activity.notes || '-'
                      )}
                    </td>
                    <td>{activity.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data-cell">
                    No recent activities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;