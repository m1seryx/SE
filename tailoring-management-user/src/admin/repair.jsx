import React, { useState } from 'react';
import '../adminStyle/dryclean.css'; // Reuse same styles
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

const DAMAGE_TYPES = [
  "Tears / Holes",
  "Loose seams / Stitch unraveling",
  "Missing buttons / Fasteners",
  "Broken zippers",
  "Fraying edges / Hems",
  "Snags / Pulls",
  "Stretching / Misshaping",
  "Fabric thinning"
];

const Repair = () => {
  const [allItems, setAllItems] = useState([
    // Pending Repair Requests
    {
      id: 1,
      uniqueNo: "R223111",
      name: "Juan Dela Cruz",
      garment: "Suit Jacket",
      damageType: "Broken zippers",
      price: 650,
      date: "2024-11-25",
      isPending: true
    },
    {
      id: 2,
      uniqueNo: "R223112",
      name: "Ana Garcia",
      garment: "Evening Gown",
      damageType: "Tears / Holes",
      price: 1200,
      date: "2024-11-26",
      isPending: true
    },
    // Accepted Repair Orders
    {
      id: 3,
      uniqueNo: "R223113",
      name: "Maria Santos",
      garment: "Barong Tagalog",
      damageType: "Missing buttons / Fasteners",
      price: 450,
      date: "2024-11-20",
      status: "In Progress",
      isPending: false
    },
    {
      id: 4,
      uniqueNo: "R244222",
      name: "Ben Santos",
      garment: "Tuxedo Pants",
      damageType: "Fraying edges / Hems",
      price: 800,
      date: "2024-11-18",
      status: "To Pick up",
      isPending: false
    },
    {
      id: 5,
      uniqueNo: "R244333",
      name: "Sofia Reyes",
      garment: "Blazer",
      damageType: "Loose seams / Stitch unraveling",
      price: 550,
      date: "2024-11-15",
      status: "Completed",
      isPending: false
    },
    {
      id: 6,
      uniqueNo: "R244444",
      name: "Carlos Lim",
      garment: "Formal Shirt",
      damageType: "Snags / Pulls",
      price: 350,
      date: "2024-11-10",
      status: "Overdue",
      isPending: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    name: '',
    garment: '',
    damageType: DAMAGE_TYPES[0],
    price: '',
    status: 'In Progress'
  });

  const pendingAppointments = allItems.filter(item => item.isPending);
  const acceptedOrders = allItems.filter(item => !item.isPending);

  const stats = {
    pending: pendingAppointments.length,
    inProgress: acceptedOrders.filter(o => o.status === 'In Progress').length,
    toPickup: acceptedOrders.filter(o => o.status === 'To Pick up').length,
    completed: acceptedOrders.filter(o => o.status === 'Completed').length,
    overdue: acceptedOrders.filter(o => o.status === 'Overdue').length
  };

  const getFilteredItems = () => {
    let items = viewFilter === "pending" ? pendingAppointments :
                viewFilter === "accepted" ? acceptedOrders : allItems;

    items = items.filter(item =>
      !searchTerm ||
      item.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.garment.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter && viewFilter !== 'pending') {
      items = items.filter(item => item.status === statusFilter);
    }
    return items;
  };

  const handleAccept = (id) => {
    setAllItems(prev => prev.map(item =>
      item.id === id ? { ...item, isPending: false, status: "In Progress" } : item
    ));
    alert("Repair request accepted!");
  };

  const handleDecline = (id) => {
    if (window.confirm("Decline this repair request?")) {
      setAllItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateStatus = (id, status) => {
    setAllItems(prev => prev.map(item =>
      item.id === id ? { ...item, status } : item
    ));
  };

  const generateUniqueNo = () => 'R' + Date.now().toString().slice(-6);

  const handleAddOrder = () => {
    if (!newOrder.name || !newOrder.garment || !newOrder.price || parseFloat(newOrder.price) <= 0) {
      alert('Please fill all required fields.');
      return;
    }

    const order = {
      id: Date.now(),
      uniqueNo: generateUniqueNo(),
      ...newOrder,
      price: parseFloat(newOrder.price),
      date: new Date().toISOString().split('T')[0],
      isPending: false
    };

    setAllItems([...allItems, order]);
    setShowAddModal(false);
    setNewOrder({ name: '', garment: '', damageType: DAMAGE_TYPES[0], price: '', status: 'In Progress' });
    alert('Repair order added successfully!');
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
          <div>
            <h2>Repair Services Management</h2>
            <p>Manage garment repair requests and ongoing fixes</p>
          </div>
          <button className="add-rep" onClick={() => setShowAddModal(true)}>
            Add Repair
          </button>
        </div>

        {/* Stats */}
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


        {/* Tabs */}
        <div className="view-tabs">
          <button className={viewFilter === 'all' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('all')}>
            All ({allItems.length})
          </button>
          <button className={viewFilter === 'pending' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('pending')}>
            Pending ({pendingAppointments.length})
          </button>
          <button className={viewFilter === 'accepted' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('accepted')}>
            Accepted ({acceptedOrders.length})
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Unique No, Name, or Garment"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {viewFilter !== 'pending' && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option>In Progress</option>
              <option>To Pick up</option>
              <option>Completed</option>
              <option>Overdue</option>
            </select>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Unique No.</th>
                <th>Name</th>
                <th>Garment</th>
                <th>Damage Type</th>
                <th>Date</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredItems().length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No repair orders found</td></tr>
              ) : (
                getFilteredItems().map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.uniqueNo}</strong></td>
                    <td>{item.name}</td>
                    <td>{item.garment}</td>
                    <td><span style={{ fontSize: '0.9em', color: '#d32f2f' }}>{item.damageType}</span></td>
                    <td>{item.date}</td>
                    <td>₱{item.price.toLocaleString()}</td>
                    <td>
                      {item.isPending ? (
                        <span className="status-badge pending">Pending</span>
                      ) : (
                        <select
                          className="status-select"
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, e.target.value)}
                        >
                          <option>In Progress</option>
                          <option>To Pick up</option>
                          <option>Completed</option>
                          <option>Overdue</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {item.isPending ? (
                        <>
                          <button className="accept-btn" onClick={() => handleAccept(item.id)}
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
                            >Accept</button>
                          <button className="decline-btn" onClick={() => handleDecline(item.id)}
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
                            
                            >Decline</button>
                        </>
                      ) : null}
                      <button className="action-btn view-btn" onClick={() => handleViewDetails(item.id)}
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
                        >View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Repair Order Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Repair Order</h2>
              <span className="close-modal" onClick={() => setShowAddModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" value={newOrder.name} onChange={(e) => setNewOrder({...newOrder, name: e.target.value})} placeholder="e.g. Pedro Penduko" />
              </div>
              <div className="form-group">
                <label>Garment</label>
                <input type="text" value={newOrder.garment} onChange={(e) => setNewOrder({...newOrder, garment: e.target.value})} placeholder="e.g. Leather Jacket" />
              </div>
              <div className="form-group">
                <label>Damage Type</label>
                <select value={newOrder.damageType} onChange={(e) => setNewOrder({...newOrder, damageType: e.target.value})}>
                  {DAMAGE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Repair Price (₱)</label>
                <input type="number" value={newOrder.price} onChange={(e) => setNewOrder({...newOrder, price: e.target.value})} placeholder="e.g. 850" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAddOrder}>Add Repair Order</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Repair Order Details</h2>
              <span className="close-modal" onClick={() => setShowDetailModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Unique No:</strong> {selectedOrder.uniqueNo}</div>
              <div className="detail-row"><strong>Customer:</strong> {selectedOrder.name}</div>
              <div className="detail-row"><strong>Garment:</strong> {selectedOrder.garment}</div>
              <div className="detail-row"><strong>Damage Type:</strong> 
                <span style={{ color: '#d32f2f', fontWeight: '600' }}>{selectedOrder.damageType}</span>
              </div>
              <div className="detail-row"><strong>Date Received:</strong> {selectedOrder.date}</div>
              <div className="detail-row"><strong>Repair Cost:</strong> ₱{selectedOrder.price.toLocaleString()}</div>
              <div className="detail-row"><strong>Status:</strong> 
                <span className={`status-badge ${selectedOrder.isPending ? 'pending' : selectedOrder.status.toLowerCase().replace(' ', '-')}`}>
                  {selectedOrder.isPending ? 'Pending' : selectedOrder.status}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repair;