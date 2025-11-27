import React, { useState } from 'react';
import '../adminStyle/dryclean.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

const DryCleaning = () => {
  // Initial pending appointments (from customer requests)
  const initialAppointments = [
    {
      id: 1,
      uniqueNo: "D223111",
      name: "Juan Dela Cruz",
      garment: "Suit",
      ClothingBrand: "Channel",
      Quantity: "1 kilo",
      price: 500,
      date: "2024-11-25",
      isPending: true
    },
    {
      id: 2,
      uniqueNo: "D223112",
      name: "Ana Garcia",
      garment: "Wedding Dress",
      ClothingBrand: "Channel",
      Quantity: "1 kilo",
      price: 1200,
      date: "2024-11-26",
      isPending: true
    }
  ];

  // Initial accepted orders
  const initialOrders = [
    {
      id: 3,
      uniqueNo: "D223113",
      name: "Maria Santos",
      garment: "Barong",
      ClothingBrand: "Channel",
      Quantity: "1 kilo",
      price: 800,
      date: "2024-11-20",
      status: "In Progress",
      isPending: false
    },
    {
      id: 4,
      uniqueNo: "D244222",
      name: "Ben Santos",
      garment: "Wedding Gown",
      ClothingBrand: "Channel",
      Quantity: "1 kilo",
      price: 1500,
      date: "2024-11-18",
      status: "To Pick up",
      isPending: false
    },
    {
      id: 5,
      uniqueNo: "D244333",
      name: "Sofia Santos",
      garment: "Dress",
      ClothingBrand: "Channel",
      Quantity: "1 kilo",
      price: 600,
      date: "2024-11-15",
      status: "Completed",
      isPending: false
    },
    {
      id: 6,
      uniqueNo: "D244444",
      name: "Carlos Santos",
      garment: "Barong",
      ClothingBrand: "Channel",
      Quantity: "1 kilo",
      price: 750,
      date: "2024-11-10",
      status: "Overdue",
      isPending: false
    }
  ];

  const [allItems, setAllItems] = useState([...initialAppointments, ...initialOrders]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    name: '',
    garment: '',
    ClothingBrand: '',
    Quantity: '',
    price: '',
    status: 'In Progress'
  });

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

  // Helper function for status styling
  const getStatusClass = (status) => {
    const statusMap = {
      'In Progress': 'in-progress',
      'To Pick up': 'to-pickup',
      'Completed': 'completed',
      'Overdue': 'overdue'
    };
    return statusMap[status] || '';
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
    if (statusFilter && viewFilter !== 'pending') {
      items = items.filter(item => !item.isPending && item.status === statusFilter);
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  // Accept appointment
  const handleAccept = (id) => {
    setAllItems(allItems.map(item => 
      item.id === id 
        ? { ...item, isPending: false, status: "In Progress" }
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

  const generateUniqueNo = () => 'D' + Date.now().toString().slice(-6);

  const handleAddOrder = () => {
    if (!newOrder.name || !newOrder.garment || !newOrder.ClothingBrand || !newOrder.Quantity || !newOrder.price || parseFloat(newOrder.price) <= 0) {
      alert('Please fill all fields correctly.');
      return;
    }

    const order = {
      id: Date.now(),
      uniqueNo: generateUniqueNo(),
      name: newOrder.name,
      garment: newOrder.garment,
      ClothingBrand: newOrder.ClothingBrand,
      Quantity: newOrder.Quantity,
      price: parseFloat(newOrder.price),
      date: new Date().toISOString().split('T')[0],
      status: newOrder.status,
      isPending: false
    };

    setAllItems([...allItems, order]);
    setShowAddModal(false);
    setNewOrder({ name: '', garment: '', ClothingBrand: '', Quantity: '', price: '', status: 'In Progress' });
    alert('Order added successfully!');
  };

  const handleViewDetails = (id) => {
    const item = allItems.find(o => o.id === id);
    setSelectedOrder(item);
    setShowDetailModal(true);
  };

  return (
    <div className="dry-cleaning-management">
      <Sidebar />
      <AdminHeader />
      <div className="content">
        <div className="dashboard-title">
          <h2>Dry Cleaning Management</h2>
          <p>Track and manage all dry cleaning orders</p>
          <button className="add-rep" onClick={() => setShowAddModal(true)}>Add Order +</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Pending</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#f57c00' }}>⏳</div>
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
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>📦</div>
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
          <div className="stat-card">
            <div className="stat-header">
              <span>Overdue</span>
              <div className="stat-icon" style={{ background: '#ffebee', color: '#f44336' }}>⚠</div>
            </div>
            <div className="stat-number">{stats.overdue}</div>
          </div>
        </div>

        {/* View Filter Tabs */}
        <div className="view-tabs">
          <button 
            className={`tab-btn ${viewFilter === 'all' ? 'active' : ''}`}
            onClick={() => setViewFilter('all')}
          >
            All ({allItems.length})
          </button>
          <button 
            className={`tab-btn ${viewFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setViewFilter('pending')}
          >
            Pending Appointments ({pendingAppointments.length})
          </button>
          <button 
            className={`tab-btn ${viewFilter === 'accepted' ? 'active' : ''}`}
            onClick={() => setViewFilter('accepted')}
          >
            Accepted Orders ({acceptedOrders.length})
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Unique No."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="To Pick up">To Pick up</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Unique No.</th>
                <th>Name</th>
                <th>Garment</th>
                <th>Clothing Brand</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.uniqueNo}</strong></td>
                    <td>{item.name}</td>
                    <td>{item.garment}</td>
                    <td>{item.ClothingBrand}</td>
                    <td>{item.Quantity}</td>
                    <td>{item.date}</td>
                    <td>
                      {item.isPending ? (
                        <span className="status-badge pending">
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
                        <div className="buttons">
                          <button
                            className="accept-btn"
                            onClick={() => handleAccept(item.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="decline-btn"
                            onClick={() => handleDecline(item.id)}
                          >
                            Decline
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleViewDetails(item.id)}
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <button
                          className="action-btn"
                          onClick={() => handleViewDetails(item.id)}
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

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) setShowAddModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Order</h2>
              <span className="close-modal" onClick={() => setShowAddModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={newOrder.name}
                  onChange={(e) => setNewOrder({ ...newOrder, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Garment</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding Gown"
                  value={newOrder.garment}
                  onChange={(e) => setNewOrder({ ...newOrder, garment: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Clothing Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Channel"
                  value={newOrder.ClothingBrand}
                  onChange={(e) => setNewOrder({ ...newOrder, ClothingBrand: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="text"
                  placeholder="e.g. 1 kilo"
                  value={newOrder.Quantity}
                  onChange={(e) => setNewOrder({ ...newOrder, Quantity: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newOrder.status}
                  onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="To Pick up">To Pick up</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAddOrder}>Add Order</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) setShowDetailModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <span className="close-modal" onClick={() => setShowDetailModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Unique No:</strong> 
                <span>{selectedOrder.uniqueNo}</span>
              </div>
              <div className="detail-row">
                <strong>Customer:</strong> 
                <span>{selectedOrder.name}</span>
              </div>
              <div className="detail-row">
                <strong>Garment:</strong> 
                <span>{selectedOrder.garment}</span>
              </div>
              <div className="detail-row">
                <strong>Clothing Brand:</strong> 
                <span>{selectedOrder.ClothingBrand}</span>
              </div>
              <div className="detail-row">
                <strong>Quantity:</strong> 
                <span>{selectedOrder.Quantity}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong> 
                <span>{selectedOrder.date}</span>
              </div>
              <div className="detail-row">
                <strong>Price:</strong> 
                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  ₱{selectedOrder.price?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`status-badge ${selectedOrder.isPending ? 'pending' : selectedOrder.status.toLowerCase().replace(' ', '-')}`}>
                  {selectedOrder.isPending ? 'Pending' : selectedOrder.status}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DryCleaning;