import React, { useState } from 'react';
import '../adminStyle/customize.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

const Customize = () => {
  // Initial pending appointments (from customer requests)
  const initialAppointments = [
    {
      id: 1,
      uniqueNo: "C223111",
      name: "Juan Dela Cruz",
      garment: "Suit",
      date: "2024-11-25",
      price: 1200,
      isPending: true
    },
    {
      id: 2,
      uniqueNo: "C223112",
      name: "Ana Garcia",
      garment: "Wedding Dress",
      date: "2024-11-26",
      price: 2500,
      isPending: true
    }
  ];

  // Initial accepted orders
  const initialOrders = [
    {
      id: 3,
      uniqueNo: "C223111",
      name: "Maria Santos",
      garment: "Barong",
      date: "2024-11-20",
      price: 900,
      status: "In Progress",
      isPending: false
    },
    {
      id: 4,
      uniqueNo: "C244222",
      name: "Ben Santos",
      garment: "Wedding Gown",
      date: "2024-11-18",
      price: 1800,
      status: "To Pick up",
      isPending: false
    },
    {
      id: 5,
      uniqueNo: "C244333",
      name: "Sofia Santos",
      garment: "Dress",
      date: "2024-11-15",
      price: 800,
      status: "Completed",
      isPending: false
    },
    {
      id: 6,
      uniqueNo: "C244444",
      name: "Carlos Santos",
      garment: "Barong",
      date: "2024-11-10",
      price: 1200,
      status: "Overdue",
      isPending: false
    }
  ];

  const [allItems, setAllItems] = useState([...initialAppointments, ...initialOrders]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewFilter, setViewFilter] = useState("all"); // 'all', 'pending', 'accepted'
  const [detailModal, setDetailModal] = useState({ open: false, order: null });

  // Get pending appointments
  const pendingAppointments = allItems.filter(item => item.isPending);
  
  // Get accepted orders
  const acceptedOrders = allItems.filter(item => !item.isPending);

  const stats = {
    pending: pendingAppointments.length,
    inProgress: acceptedOrders.filter(o => o.status === 'In Progress').length,
    toPickup: acceptedOrders.filter(o => o.status === 'To Pick up').length,
    completed: acceptedOrders.filter(o => o.status === 'Completed').length,
    overdue: acceptedOrders.filter(o => o.status === 'Overdue').length
  };

  // Filter logic
  const getFilteredItems = () => {
    let items = [];
    
    if (viewFilter === "pending") {
      items = pendingAppointments;
    } else if (viewFilter === "accepted") {
      items = acceptedOrders;
    } else {
      items = allItems;
    }

    // Apply search filter
    items = items.filter(item => {
      const matchesSearch = searchTerm === "" || 
        item.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // Apply status filter only for accepted orders
    if (statusFilter && !items[0]?.isPending) {
      items = items.filter(item => item.status === statusFilter);
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  // Accept appointment
  const handleAccept = (id) => {
    setAllItems(allItems.map(item => 
      item.id === id 
        ? { ...item, isPending: false, status: "In Progress", uniqueNo: item.uniqueNo.replace('A', 'C') }
        : item
    ));
    alert(`Appointment accepted and converted to order!`);
  };

  // Decline appointment
  const handleDecline = (id) => {
    if (window.confirm("Are you sure you want to decline this appointment?")) {
      setAllItems(allItems.filter(item => item.id !== id));
      alert("Appointment declined and removed.");
    }
  };

  // Update status for accepted orders
  const updateStatus = (orderId, newStatus) => {
    setAllItems(allItems.map(item => 
      item.id === orderId ? { ...item, status: newStatus } : item
    ));
    const item = allItems.find(o => o.id === orderId);
    if (item) {
      alert(`Order ${item.uniqueNo} status updated to ${newStatus}!`);
    }
  };

  const viewDetails = (id) => {
    const item = allItems.find(o => o.id === id);
    if (item) {
      setDetailModal({ open: true, order: item });
    }
  };

  const getStatusClass = (status) => {
    return status?.toLowerCase().replace(' ', '-') || '';
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'In Progress': 'in-progress',
      'To Pick up': 'to-pickup',
      'Completed': 'completed',
      'Overdue': 'overdue'
    };
    return classes[status] || '';
  };

  return (
    <div>
      <Sidebar />
      <AdminHeader />
         
      {/* Main Content */}
      <div className="content">
        <div className="dashboard-title">
          <div>
            <h2>Customization Management</h2>
            <p>Track personalized clothes and appointments</p>
          </div>
          <div className="add-rep">Add Customize +</div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Pending Appointments</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>⏳</div>
            </div>
            <div className="stat-number">{stats.pending}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>In Progress</span>
              <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2196f3' }}>🔄</div>
            </div>
            <div className="stat-number">{stats.inProgress}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>To Pick up</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>📦</div>
            </div>
            <div className="stat-number">{stats.toPickup}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Completed</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>✓</div>
            </div>
            <div className="stat-number">{stats.completed}</div>
          </div>
        </div>

        {/* View Filter Tabs */}
        <div className="view-tabs" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button 
            className={`tab-btn ${viewFilter === 'all' ? 'active' : ''}`}
            onClick={() => setViewFilter('all')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              background: viewFilter === 'all' ? '#6A3C3E' : '#f0f0f0',
              color: viewFilter === 'all' ? 'white' : '#333',
              transition: 'all 0.3s'
            }}
          >
            All ({allItems.length})
          </button>
          <button 
            className={`tab-btn ${viewFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setViewFilter('pending')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              background: viewFilter === 'pending' ? '#6A3C3E' : '#f0f0f0',
              color: viewFilter === 'pending' ? 'white' : '#333',
              transition: 'all 0.3s'
            }}
          >
            Pending Appointments ({pendingAppointments.length})
          </button>
          <button 
            className={`tab-btn ${viewFilter === 'accepted' ? 'active' : ''}`}
            onClick={() => setViewFilter('accepted')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              background: viewFilter === 'accepted' ? '#6A3C3E' : '#f0f0f0',
              color: viewFilter === 'accepted' ? 'white' : '#333',
              transition: 'all 0.3s'
            }}
          >
            Accepted Orders ({acceptedOrders.length})
          </button>
        </div>

        {/* Search Container */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search Unique Number or Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Only show status filter for accepted orders */}
          {viewFilter !== 'pending' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="To Pick up">To Pick up</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="container">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Unique No.</th>
                <th>Name</th>
                <th>Garment</th>
                <th>Date</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.uniqueNo}</strong></td>
                    <td>{item.name}</td>
                    <td>{item.garment}</td>
                    <td>{item.date}</td>
                    <td>₱{item.price.toLocaleString()}</td>
                    <td>
                      {item.isPending ? (
                        <span className="status-badge" style={{ 
                          background: '#fff3e0', 
                          color: '#f57c00',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}>
                          Pending
                        </span>
                      ) : (
                        <select
                          className={`status-select ${getStatusClass(item.status)}`}
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, e.target.value)}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="To Pick up">To Pick up</option>
                          <option value="Completed">Completed</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {item.isPending ? (
                        <div className="buttons" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="accept-btn"
                            onClick={() => handleAccept(item.id)}
                            style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#27AE60',
                              color: 'white'
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className="decline-btn"
                            onClick={() => handleDecline(item.id)}
                            style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#E74C3C',
                              color: 'white'
                            }}
                          >
                            Decline
                          </button>
                          <button
                            className="action-btn view-btn"
                            onClick={() => viewDetails(item.id)}
                            style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#2196f3',
                              color: 'white'
                            }}
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <button
                          className="action-btn view-btn"
                          onClick={() => viewDetails(item.id)}
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {detailModal.open && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          onClick={() => setDetailModal({ open: false, order: null })}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{detailModal.order?.isPending ? 'Appointment' : 'Order'} Details</h2>
              <span
                className="close-modal"
                onClick={() => setDetailModal({ open: false, order: null })}
              >
                ×
              </span>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Item Photo:</strong>
                <img
                  src="https://via.placeholder.com/120"
                  alt="Item"
                  className="item-image"
                />
              </div>
              <div className="detail-row">
                <strong>Unique No:</strong>
                <span>{detailModal.order?.uniqueNo}</span>
              </div>
              <div className="detail-row">
                <strong>Customer Name:</strong>
                <span>{detailModal.order?.name}</span>
              </div>
              <div className="detail-row">
                <strong>Customization Details:</strong>
                <span>{detailModal.order?.garment}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{detailModal.order?.date}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                {detailModal.order?.isPending ? (
                  <span className="status-badge" style={{ background: '#fff3e0', color: '#f57c00' }}>
                    Pending Appointment
                  </span>
                ) : (
                  <span className={`status-badge ${getStatusBadgeClass(detailModal.order?.status)}`}>
                    {detailModal.order?.status}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {detailModal.order?.isPending ? (
                <>
                  <button
                    className="btn-save"
                    onClick={() => {
                      handleAccept(detailModal.order.id);
                      setDetailModal({ open: false, order: null });
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className="close-btn"
                    style={{ background: '#E74C3C' }}
                    onClick={() => {
                      handleDecline(detailModal.order.id);
                      setDetailModal({ open: false, order: null });
                    }}
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  className="close-btn"
                  onClick={() => setDetailModal({ open: false, order: null })}
                >
                  Edit
                </button>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customize;