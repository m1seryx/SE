import React, { useState } from 'react';
import '../adminStyle/inventory.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

const Inventory = () => {
  const initialOrders = [
    { id: 1, uniqueNo: "C223111", customer: "Maria Santos", service: "Customization", item: "Barong Tagalog", date: "2024-11-15", price: 4500 },
    { id: 2, uniqueNo: "DC244222", customer: "Ben Lim", service: "Dry Cleaning", item: "Wedding Gown", date: "2024-11-18", price: 1800 },
    { id: 3, uniqueNo: "R333555", customer: "Sofia Reyes", service: "Rentals", item: "Black Suit", date: "2024-11-10", price: 3500 },
    { id: 4, uniqueNo: "RP444666", customer: "Carlos Tan", service: "Repairs", item: "Leather Jacket", date: "2024-11-12", price: 2800 },
    { id: 5, uniqueNo: "C555777", customer: "Anna Cruz", service: "Customization", item: "Formal Dress", date: "2024-11-19", price: 6200 },
    { id: 6, uniqueNo: "DC666888", customer: "Mark Santos", service: "Dry Cleaning", item: "Blazer & Pants", date: "2024-11-17", price: 1500 }
  ];

  const [completedOrders, setCompletedOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("");
  const [detailModal, setDetailModal] = useState({ open: false, order: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, orderId: null });

  const stats = {
    Customization: completedOrders.filter(o => o.service === "Customization").length,
    "Dry Cleaning": completedOrders.filter(o => o.service === "Dry Cleaning").length,
    Rentals: completedOrders.filter(o => o.service === "Rentals").length,
    Repairs: completedOrders.filter(o => o.service === "Repairs").length
  };

  const filteredOrders = filter 
    ? completedOrders.filter(o => o.service === filter)
    : completedOrders;

  const viewOrder = (id) => {
    const order = completedOrders.find(o => o.id === id);
    if (order) {
      setDetailModal({ open: true, order });
    }
  };

  const confirmDelete = (id) => {
    setDeleteModal({ open: true, orderId: id });
  };

  const handleDelete = () => {
    setCompletedOrders(completedOrders.filter(o => o.id !== deleteModal.orderId));
    setDeleteModal({ open: false, orderId: null });
    alert("Order deleted permanently.");
  };

  const getServiceColor = (service) => {
    const colors = {
      'Customization': 'service-customization',
      'Dry Cleaning': 'service-cleaning',
      'Rentals': 'service-rentals',
      'Repairs': 'service-repairs'
    };
    return colors[service] || '';
  };

  return (
    <div className="inventory-container">
              <Sidebar />
              <AdminHeader />

      {/* Main Content */}
      <div className="content">
        <h2>Completed Orders History</h2>
        <p>View all completed services across Customization, Dry Cleaning, Rentals, and Repairs</p>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Completed Customization</span>
              <div className="stat-icon">✓</div>
            </div>
            <div className="stat-number">{stats.Customization}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span>Completed Dry Cleaning</span>
              <div className="stat-icon">✓</div>
            </div>
            <div className="stat-number">{stats['Dry Cleaning']}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span>Returned Rentals</span>
              <div className="stat-icon">✓</div>
            </div>
            <div className="stat-number">{stats.Rentals}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <span>Completed Repairs</span>
              <div className="stat-icon">✓</div>
            </div>
            <div className="stat-number">{stats.Repairs}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="search-container">
          <select 
            id="filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Services</option>
            <option value="Customization">Customization</option>
            <option value="Dry Cleaning">Dry Cleaning</option>
            <option value="Rentals">Rentals</option>
            <option value="Repairs">Repairs</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Unique No.</th>
                <th>Customer</th>
                <th>Service Type</th>
                <th>Item</th>
                <th>Date Completed</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No completed orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.uniqueNo}</strong></td>
                    <td>{order.customer}</td>
                    <td>
                      <span className={`service-badge ${getServiceColor(order.service)}`}>
                        {order.service}
                      </span>
                    </td>
                    <td>{order.item}</td>
                    <td>{order.date}</td>
                    <td>₱{order.price.toLocaleString()}</td>
                    <td>
                      <button 
                        className="deleteBtn"
                        onClick={() => confirmDelete(order.id)}
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
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal.open && (
        <div 
          className="modal-overlay"
          onClick={() => setDetailModal({ open: false, order: null })}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Order Details</h2>
              <span 
                className="close-modal"
                onClick={() => setDetailModal({ open: false, order: null })}
              >
                ×
              </span>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Unique No:</strong>
                <span>{detailModal.order?.uniqueNo}</span>
              </div>
              <div className="detail-row">
                <strong>Customer:</strong>
                <span>{detailModal.order?.customer}</span>
              </div>
              <div className="detail-row">
                <strong>Service:</strong>
                <span>{detailModal.order?.service}</span>
              </div>
              <div className="detail-row">
                <strong>Item:</strong>
                <span>{detailModal.order?.item}</span>
              </div>
              <div className="detail-row">
                <strong>Date Completed:</strong>
                <span>{detailModal.order?.date}</span>
              </div>
              <div className="detail-row">
                <strong>Price:</strong>
                <span className="price-highlight">
                  ₱{detailModal.order?.price.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="close-btn"
                onClick={() => setDetailModal({ open: false, order: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div 
          className="modal delete-modal"
          onClick={() => setDeleteModal({ open: false, orderId: null })}
        >
          <div 
            className="modal-content small"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Order?</h3>
            <p>This completed order will be permanently removed from records.</p>
            <div className="modal-buttons">
              <button 
                id="cancelDelete"
                onClick={() => setDeleteModal({ open: false, orderId: null })}
              >
                Cancel
              </button>
              <button 
                id="confirmDelete"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
