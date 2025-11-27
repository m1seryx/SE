import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import '../adminStyle/repair.css';

const Repair = () => {
  // Initial pending appointments (from customer requests)
  const initialAppointments = [
    {
      id: 1,
      uniqueNo: "R223111",
      name: "Juan Dela Cruz",
      item: "Black Formal Shirt",
      category: "Shirt", 
      date: "2024-11-10",
      price: 1200,
      status: "Pending",
      image: "https://via.placeholder.com/120?text=Shirt+Damage",
      isPending: true
    },
    {
      id: 2,
      uniqueNo: "R223112",
      name: "Ana Garcia",
      item: "Black Formal Shirt",
      category: "Shirt", 
      date: "2024-11-10",
      price: 1200,
      status: "Pending",
      image: "https://via.placeholder.com/120?text=Shirt+Damage",
      isPending: true
    }
  ];

  const initialOrders = [
    {
      id: 3,
      uniqueNo: "R223111",
      name: "Maria Santos",
      item: "Black Formal Shirt",
      category: "Shirt", 
      date: "2024-11-10",
      price: 1200,
      status: "In Progress",
      image: "https://via.placeholder.com/120?text=Shirt+Damage",
      isPending: false
    },
    {
      id: 4,
      uniqueNo: "R244222",
      name: "Ben Santos",
      item: "Black Formal Shirt",
      category: "Shirt", 
      date: "2024-11-10",
      price: 1200,
      status: "Overdue",
      image: "https://via.placeholder.com/120?text=Shirt+Damage",
      isPending: false
    },
    {
      id: 5,
      uniqueNo: "R244333",
      name: "Sofia Santos",
      item: "Black Formal Shirt",
      category: "Shirt", 
      date: "2024-11-10",
      price: 1200,
      status: "Completed",
      image: "https://via.placeholder.com/120?text=Shirt+Damage",
      isPending: false
    },
    {
      id: 6,
      uniqueNo: "R244444",
      name: "Carlos Santos",
      item: "Black Formal Shirt",
      category: "Shirt", 
      date: "2024-11-10",
      price: 1200,
      status: "To Pick up",
      image: "https://via.placeholder.com/120?text=Shirt+Damage",
      isPending: false
    }
  ];

  const [allItems, setAllItems] = useState([...initialAppointments, ...initialOrders]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [newRepair, setNewRepair] = useState({
    name: '',
    item: '',
    category: 'Shirt',
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

  const generateUniqueNo = () => 'R' + Date.now().toString().slice(-6);

  const handleAddRepair = () => {
    if (!newRepair.name || !newRepair.item || !newRepair.price || parseFloat(newRepair.price) <= 0) {
      alert('Please fill all fields correctly.');
      return;
    }

    const repair = {
      id: Date.now(),
      uniqueNo: generateUniqueNo(),
      name: newRepair.name,
      item: newRepair.item,
      category: newRepair.category,
      date: new Date().toISOString().split('T')[0],
      price: parseFloat(newRepair.price),
      status: newRepair.status,
      image: "https://via.placeholder.com/120?text=New+Repair",
      isPending: false
    };

    setAllItems([...allItems, repair]);
    setShowAddModal(false);
    setNewRepair({ name: '', item: '', category: 'Shirt', price: '', status: 'In Progress' });
    alert('Repair order added successfully!');
  };

  const handleViewDetails = (id) => {
    const item = allItems.find(r => r.id === id);
    setSelectedRepair(item);
    setShowDetailModal(true);
  };

  return (
    <div className="repair-management">
      <Sidebar />
      <AdminHeader />

      <div className="content">
        <div className="dashboard-title">
          <h2>Repair Management</h2>
          <p>Manage repair services and track progress</p>
          <button className="add-rep" onClick={() => setShowAddModal(true)}>Add Repair +</button>
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

        <div className="search-container">
          <input
            type="text"
            placeholder="Search Unique No. or Name"
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
                <th>Item</th>
                <th>Category</th>
                <th>Date</th>
                <th>Price</th>
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
                    <td>{item.item}</td>
                    <td>{item.category}</td>
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
                            onClick={() => handleViewDetails(item.id)}
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

      {/* Add Repair Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.className === 'modal-overlay active') setShowAddModal(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Repair</h2>
              <span className="close-modal" onClick={() => setShowAddModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={newRepair.name}
                  onChange={(e) => setNewRepair({ ...newRepair, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Item</label>
                <input
                  type="text"
                  placeholder="e.g. Torn Barong"
                  value={newRepair.item}
                  onChange={(e) => setNewRepair({ ...newRepair, item: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newRepair.category}
                  onChange={(e) => setNewRepair({ ...newRepair, category: e.target.value })}
                >
                  <option value="Shirt">Shirt</option>
                  <option value="Pants">Pants</option>
                  <option value="Dress">Dress</option>
                  <option value="Jacket">Jacket</option>
                  <option value="Blazer">Blazer</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="form-group">
                <label>Repair Cost (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  min="1"
                  value={newRepair.price}
                  onChange={(e) => setNewRepair({ ...newRepair, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newRepair.status}
                  onChange={(e) => setNewRepair({ ...newRepair, status: e.target.value })}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="To Pick up">To Pick up</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-save" onClick={handleAddRepair}>Add Repair</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedRepair && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.className === 'modal-overlay active') setShowDetailModal(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Repair Order Details</h2>
              <span className="close-modal" onClick={() => setShowDetailModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Item Photo:</strong>
                <img src={selectedRepair.image} alt="Item" className="item-image" style={{ maxWidth: '200px', borderRadius: '8px', marginTop: '10px' }} />
              </div>
              <div className="detail-row"><strong>Unique No:</strong> <span>{selectedRepair.uniqueNo}</span></div>
              <div className="detail-row"><strong>Customer:</strong> <span>{selectedRepair.name}</span></div>
              <div className="detail-row"><strong>Item:</strong> <span>{selectedRepair.item}</span></div>
              <div className="detail-row"><strong>Category:</strong> <span>{selectedRepair.category}</span></div>
              <div className="detail-row"><strong>Drop-off Date:</strong> <span>{selectedRepair.date}</span></div>
              <div className="detail-row"><strong>Repair Cost:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>₱{selectedRepair.price.toLocaleString()}</span></div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`status-badge ${selectedRepair.isPending ? 'pending' : selectedRepair.status.toLowerCase().replace(' ', '-')}`}>
                  {selectedRepair.isPending ? 'Pending' : selectedRepair.status}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-save" style={{ background: '#666' }} onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repair;