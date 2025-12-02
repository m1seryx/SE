import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../adminStyle/admin.css';
import AdminHeader from './AdminHeader';
import { getAdminDashboardOverview } from '../api/AdminDashboardApi';

function AdminPage() {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminDashboardOverview();
        if (data?.success) {
          setStats(data.stats || []);
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

  return (
    <div className="admin-page">
      <Sidebar />
      <AdminHeader />
      
      <div className="content">
        <div className="dashboard-title">
          <h2>Dashboard Overview</h2>
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
                <h3>{stat.number}</h3>
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
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="loading-cell">
                    Loading recent activities...
                  </td>
                </tr>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <tr key={index}>
                    <td className="customer">{activity.customer}</td>
                    <td>{activity.service}</td>
                    <td>
                      <span className={`status ${activity.status}`}>
                        {activity.statusText}
                      </span>
                    </td>
                    <td>{activity.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data-cell">
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