import React from 'react';
import Sidebar from './Sidebar';
import '../adminStyle/admin.css';
import AdminHeader from './AdminHeader';

function AdminPage() {
  const stats = [
    {
      title: "Today's Appointments",
      number: "12",
      info: "+3 from yesterday"
    },
    {
      title: "Pending Orders",
      number: "15",
      info: "2 new today"

    },
    {
      title: "Daily Revenue",
      number: "₱3,456",
      info: "+12% from yesterday"
    },
    {
      title: "Monthly Growth",
      number: "+23%",
      info: "Compared to last month"
    }
  ];

  const recentActivities = [
    {
      customer: "Maria Santos",
      service: "Tuxedo Rental",
      status: "returned",
      statusText: "Returned",
      time: "10 minutes ago"
    },
    {
      customer: "John Reyes",
      service: "Fitting Appointment",
      status: "completed",
      statusText: "Completed",
      time: "30 minutes ago"
    },
    {
      customer: "Sofia Lim",
      service: "Barong Customization",
      status: "in-progress",
      statusText: "In Progress",
      time: "1 hour ago"
    },
    {
      customer: "Carlos Tan",
      service: "Dry Cleaning",
      status: "pickup",
      statusText: "To Pick up",
      time: "2 hours ago"
    }
  ];

  return (
    <div className="admin-page">
      <Sidebar />
      <AdminHeader />
      
      <div className="content">
        <div className="dashboard-title">
          <h2>Dashboard Overview</h2>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <h3>{stat.title}</h3>
              <p className="number">{stat.number}</p>
              {stat.info && <p className="info">{stat.info}</p>}
            </div>
          ))}
        </div>

        <div className="recent-activity">
          <table>
            <caption>Recent Activity</caption>
            <thead className='recent'>
              <tr>
                <th>Customer</th>
                <th>Type of Service</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;

