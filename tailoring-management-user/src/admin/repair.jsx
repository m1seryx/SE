import React, { useState, useEffect } from 'react';
import '../adminStyle/dryclean.css'; // Reuse same styles
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllRepairOrders, getRepairOrdersByStatus, updateRepairOrderItem } from '../api/RepairOrderApi';

const Repair = () => {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    finalPrice: '',
    approvalStatus: '',
    adminNotes: ''
  });

  // Helper function for status styling
  const getStatusClass = (status) => {
    const statusMap = {
      'pending_review': 'pending',
      'pending': 'pending',
      'price_confirmation': 'price-confirmation',
      'confirmed': 'in-progress',
      'ready_for_pickup': 'to-pickup',
      'completed': 'completed',
      'cancelled': 'rejected',
      'auto_confirmed': 'in-progress'
    };
    return statusMap[status] || 'pending';
  };

  // Helper function for status display text
  const getStatusText = (status) => {
    const statusTextMap = {
      'pending_review': 'Pending',
      'pending': 'Pending',
      'price_confirmation': 'Price Confirmation',
      'confirmed': 'In Progress',
      'ready_for_pickup': 'To Pick up',
      'completed': 'Completed',
      'cancelled': 'Rejected',
      'auto_confirmed': 'In Progress'
    };
    return statusTextMap[status] || 'Pending';
  };

  // Load repair orders on component mount
  useEffect(() => {
    loadRepairOrders();
  }, []);

  const loadRepairOrders = async () => {
    setLoading(true);
    setError('');
    try {
      console.log("Loading repair orders...");
      const result = await getAllRepairOrders();
      console.log("Loaded orders:", result);
      if (result.success) {
        console.log("Setting orders:", result.orders);
        // Check if any items have been updated
        result.orders.forEach(order => {
          if (order.item_id === 25) {
            console.log("Item 25 status after refresh:", order.approval_status);
          }
        });
        setAllItems(result.orders);
      } else {
        setError(result.message || 'Failed to load repair orders');
      }
    } catch (err) {
      console.error("Load error:", err);
      setError('Failed to load repair orders');
    } finally {
      setLoading(false);
    }
  };

  const pendingAppointments = allItems.filter(item => 
    item.approval_status === 'pending_review' || 
    item.approval_status === null || 
    item.approval_status === undefined ||
    item.approval_status === ''
  );

  const stats = {
    pending: pendingAppointments.length,
    inProgress: allItems.filter(o => o.approval_status === 'confirmed').length,
    toPickup: allItems.filter(o => o.approval_status === 'ready_for_pickup').length,
    completed: allItems.filter(o => o.approval_status === 'completed').length,
    rejected: allItems.filter(o => o.approval_status === 'cancelled').length
  };

  const getFilteredItems = () => {
    let items = [];
    
    if (viewFilter === "pending") {
      items = pendingAppointments;
    } else if (viewFilter === "price-confirmation") {
      items = allItems.filter(item => item.approval_status === 'price_confirmation');
    } else if (viewFilter === "in-progress") {
      items = allItems.filter(item => item.approval_status === 'confirmed');
    } else if (viewFilter === "to-pickup") {
      items = allItems.filter(item => item.approval_status === 'ready_for_pickup');
    } else if (viewFilter === "completed") {
      items = allItems.filter(item => item.approval_status === 'completed');
    } else if (viewFilter === "rejected") {
      items = allItems.filter(item => item.approval_status === 'cancelled');
    } else {
      items = allItems;
    }

    // Apply search filter
    items = items.filter(item =>
      !searchTerm ||
      item.order_id?.toString().includes(searchTerm.toLowerCase()) ||
      `${item.first_name} ${item.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.specific_data?.garmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter only for "all" tab
    if (statusFilter && viewFilter === 'all') {
      items = items.filter(item => item.approval_status === statusFilter);
    }

    return items;
  };

  const handleAccept = async (itemId) => {
    console.log("Accepting item:", itemId);
    try {
      const result = await updateRepairOrderItem(itemId, {
        approvalStatus: 'confirmed'  // Use 'confirmed' instead of 'approved'
      });
      console.log("Accept result:", result);
      if (result.success) {
        console.log("Refreshing data...");
        await loadRepairOrders(); // Refresh data
        console.log("Data refreshed");
        alert("Repair request approved!");
      } else {
        alert(result.message || "Failed to approve repair request");
      }
    } catch (err) {
      console.error("Accept error:", err);
      alert("Failed to approve repair request");
    }
  };

  const handleDecline = async (itemId) => {
    console.log("Declining item:", itemId);
    if (window.confirm("Decline this repair request?")) {
      try {
        const result = await updateRepairOrderItem(itemId, {
          approvalStatus: 'cancelled'  // Use 'cancelled' instead of 'rejected'
        });
        console.log("Decline result:", result);
        if (result.success) {
          loadRepairOrders(); // Refresh data
        } else {
          alert(result.message || "Failed to decline repair request");
        }
      } catch (err) {
        console.error("Decline error:", err);
        alert("Failed to decline repair request");
      }
    }
  };

  const updateStatus = async (itemId, status) => {
    try {
      const result = await updateRepairOrderItem(itemId, {
        approvalStatus: status
      });
      if (result.success) {
        await loadRepairOrders(); // Refresh data
        
        // Automatically switch to the correct tab based on the new status
        if (status === 'confirmed') {
          setViewFilter('in-progress');
        } else if (status === 'ready_for_pickup') {
          setViewFilter('to-pickup');
        } else if (status === 'completed') {
          setViewFilter('completed');
        } else if (status === 'cancelled') {
          setViewFilter('rejected');
        }
        
        const item = allItems.find(o => o.item_id === itemId);
        if (item) {
          alert(`Order #${item.order_id} status updated!`);
        }
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleViewDetails = (item) => {
    setSelectedOrder(item);
    setShowDetailModal(true);
  };

  const handleEditOrder = (item) => {
    setSelectedOrder(item);
    setEditForm({
      finalPrice: item.final_price || '',
      approvalStatus: item.approval_status || '',
      adminNotes: item.pricing_factors?.adminNotes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    
    try {
      console.log("Frontend - Sending edit data:", editForm);
      console.log("Frontend - Selected order:", selectedOrder);
      
      const result = await updateRepairOrderItem(selectedOrder.item_id, editForm);
      console.log("Frontend - Update result:", result);
      
      if (result.success) {
        setShowEditModal(false);
        loadRepairOrders(); // Refresh data
        alert('Repair order updated successfully!');
      } else {
        alert(result.message || 'Failed to update repair order');
      }
    } catch (err) {
      console.error("Frontend - Update error:", err);
      alert('Failed to update repair order');
    }
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
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
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
              <span>Rejected</span>
              <div className="stat-icon" style={{ background: '#ffebee', color: '#f44336' }}>✕</div>
            </div>
            <div className="stat-number">{stats.rejected}</div>
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
          <button className={viewFilter === 'price-confirmation' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('price-confirmation')}>
            Price Confirmation ({allItems.filter(o => o.approval_status === 'price_confirmation').length})
          </button>
          <button className={viewFilter === 'in-progress' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('in-progress')}>
            In Progress ({allItems.filter(o => o.approval_status === 'confirmed').length})
          </button>
          <button className={viewFilter === 'to-pickup' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('to-pickup')}>
            To Pick up ({allItems.filter(o => o.approval_status === 'ready_for_pickup').length})
          </button>
          <button className={viewFilter === 'completed' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('completed')}>
            Completed ({allItems.filter(o => o.approval_status === 'completed').length})
          </button>
          <button className={viewFilter === 'rejected' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('rejected')}>
            Rejected ({allItems.filter(o => o.approval_status === 'cancelled').length})
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Unique No, Name, or Garment"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="price_confirmation">Price Confirmation</option>
            <option value="confirmed">In Progress</option>
            <option value="ready_for_pickup">To Pick up</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Garment</th>
                <th>Damage Type</th>
                <th>Damage Description</th>
                <th>Date</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading repair orders...</td></tr>
              ) : getFilteredItems().length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No repair orders found</td></tr>
              ) : (
                getFilteredItems().map(item => (
                  <tr key={item.item_id}>
                    <td><strong>#{item.order_id}</strong></td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.specific_data?.garmentType || 'N/A'}</td>
                    <td><span style={{ fontSize: '0.9em', color: '#d32f2f' }}>{item.specific_data?.serviceName || 'N/A'}</span></td>
                    <td><span style={{ fontSize: '0.8em' }}>{item.specific_data?.damageDescription?.substring(0, 50) || 'N/A'}...</span></td>
                    <td>{new Date(item.order_date).toLocaleDateString()}</td>
                    <td>₱{parseFloat(item.final_price || 0).toLocaleString()}</td>
                    <td>
                      {item.approval_status === 'pending_review' || item.approval_status === null || item.approval_status === undefined || item.approval_status === '' ? (
                        <span className={`status-badge ${getStatusClass('pending')}`}>
                          {getStatusText('pending')}
                        </span>
                      ) : (
                        <select
                          className={`status-select ${getStatusClass(item.approval_status)}`}
                          value={item.approval_status || 'pending'}
                          onChange={(e) => updateStatus(item.item_id, e.target.value)}
                        >
                          <option value="price_confirmation">Price Confirmation</option>
                          <option value="confirmed">In Progress</option>
                          <option value="ready_for_pickup">To Pick up</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Rejected</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {item.approval_status === 'pending_review' || item.approval_status === null || item.approval_status === undefined || item.approval_status === '' ? (
                        <div className="buttons">
                          <button className="accept-btn" onClick={() => handleAccept(item.item_id)}
                             style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#27AE60',
                              color: 'white',
                              marginRight: '5px'
                            }}>Accept</button>
                          <button className="edit-btn" onClick={() => handleEditOrder(item)}
                             style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#ff9800',
                              color: 'white',
                              marginRight: '5px'
                            }}>Edit Price</button>
                          <button className="decline-btn" onClick={() => handleDecline(item.item_id)}
                          style={{
                            padding: '10px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '10px',
                            background: '#E74C3C',
                            color: 'white',
                            marginRight: '5px'
                          }}>Decline</button>
                          <button className="action-btn view-btn" onClick={() => handleViewDetails(item)}
                             style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#2196f3',
                              color: 'white',
                              marginRight: '5px'
                            }}>View</button>
                          <button className="action-btn edit-btn" onClick={() => handleEditOrder(item)}
                             style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#ff9800',
                              color: 'white'
                            }}>Edit</button>
                        </div>
                      ) : (
                        <div className="buttons">
                          <button className="action-btn view-btn" onClick={() => handleViewDetails(item)}
                             style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#2196f3',
                              color: 'white',
                              marginRight: '5px'
                            }}>View</button>
                          <button className="action-btn edit-btn" onClick={() => handleEditOrder(item)}
                             style={{
                              padding: '10px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '10px',
                              background: '#ff9800',
                              color: 'white'
                            }}>Edit</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Repair Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Repair Order</h2>
              <span className="close-modal" onClick={() => setShowEditModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Order ID:</strong> #{selectedOrder.order_id}</div>
              <div className="detail-row"><strong>Garment:</strong> {selectedOrder.specific_data?.garmentType || 'N/A'}</div>
              <div className="detail-row"><strong>Service:</strong> {selectedOrder.specific_data?.serviceName || 'N/A'}</div>
              
              {selectedOrder.specific_data?.imageUrl && (
                <div className="detail-row">
                  <strong>Damage Image:</strong><br/>
                  <img 
                    src={`http://localhost:5000${selectedOrder.specific_data.imageUrl}`} 
                    alt="Damage" 
                    style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}
              
              <div className="detail-row"><strong>Damage Description:</strong> {selectedOrder.specific_data?.damageDescription || 'N/A'}</div>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Final Price (₱)</label>
                <input 
                  type="number" 
                  value={editForm.finalPrice} 
                  onChange={(e) => setEditForm({...editForm, finalPrice: e.target.value})} 
                  placeholder="Enter final price" 
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editForm.approvalStatus} 
                  onChange={(e) => setEditForm({...editForm, approvalStatus: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="price_confirmation">Price Confirmation</option>
                  <option value="approved">In Progress</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Admin Notes</label>
                <textarea 
                  value={editForm.adminNotes} 
                  onChange={(e) => setEditForm({...editForm, adminNotes: e.target.value})} 
                  placeholder="Add admin notes..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEdit}>Save Changes</button>
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
              <div className="detail-row"><strong>Order ID:</strong> #{selectedOrder.order_id}</div>
              <div className="detail-row"><strong>Garment:</strong> {selectedOrder.specific_data?.garmentType || 'N/A'}</div>
              <div className="detail-row"><strong>Service:</strong> {selectedOrder.specific_data?.serviceName || 'N/A'}</div>
              <div className="detail-row"><strong>Damage Level:</strong> {selectedOrder.specific_data?.damageLevel || 'N/A'}</div>
              
              {selectedOrder.specific_data?.imageUrl && (
                <div className="detail-row">
                  <strong>Damage Image:</strong><br/>
                  <img 
                    src={`http://localhost:5000${selectedOrder.specific_data.imageUrl}`} 
                    alt="Damage" 
                    style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}
              
              <div className="detail-row"><strong>Damage Description:</strong> {selectedOrder.specific_data?.damageDescription || 'N/A'}</div>
              <div className="detail-row"><strong>Date Received:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</div>
              <div className="detail-row"><strong>Estimated Time:</strong> {selectedOrder.pricing_factors?.estimatedTime || 'N/A'}</div>
              <div className="detail-row"><strong>Repair Cost:</strong> ₱{parseFloat(selectedOrder.final_price || 0).toLocaleString()}</div>
              <div className="detail-row"><strong>Status:</strong> 
                <span className={`status-badge ${getStatusClass(selectedOrder.approval_status || 'pending')}`}>
                  {getStatusText(selectedOrder.approval_status || 'pending')}
                </span>
              </div>
              
              {selectedOrder.pricing_factors?.adminNotes && (
                <div className="detail-row"><strong>Admin Notes:</strong> {selectedOrder.pricing_factors.adminNotes}</div>
              )}
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
