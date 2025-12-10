import React, { useState, useEffect } from 'react';
import '../adminStyle/dryclean.css'; // Reuse same styles
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllRepairOrders, getRepairOrdersByStatus, updateRepairOrderItem } from '../api/RepairOrderApi';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { useAlert } from '../context/AlertContext';

const Repair = () => {
  const { alert, confirm } = useAlert();
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

  // Image preview modal state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageAlt, setPreviewImageAlt] = useState('');

  const openImagePreview = (url, alt) => {
    setPreviewImageUrl(url);
    setPreviewImageAlt(alt);
    setImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setImagePreviewOpen(false);
    setPreviewImageUrl('');
    setPreviewImageAlt('');
  };

  // Helper function for status styling
  const getStatusClass = (status) => {
    const statusMap = {
      'pending_review': 'pending',
      'pending': 'pending',
      'accepted': 'accepted',
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
      'accepted': 'Accepted',
      'price_confirmation': 'Price Confirmation',
      'confirmed': 'In Progress',
      'ready_for_pickup': 'To Pick up',
      'completed': 'Completed',
      'cancelled': 'Rejected',
      'auto_confirmed': 'In Progress'
    };
    return statusTextMap[status] || 'Pending';
  };

  // Get next status in workflow
  const getNextStatus = (currentStatus, serviceType = 'repair', item = null) => {
    if (!currentStatus || currentStatus === 'pending_review' || currentStatus === 'pending') {
      return 'accepted';
    }
    
    // If status is 'accepted', skip 'price_confirmation' and go directly to 'confirmed'
    // Price confirmation should only appear if admin explicitly sets status to 'price_confirmation' when editing price
    if (currentStatus === 'accepted') {
      return 'confirmed';
    }
    
    // If status is 'price_confirmation', next is 'accepted' (after user confirms the price)
    if (currentStatus === 'price_confirmation') {
      return 'accepted';
    }
    
    const statusFlow = {
      'repair': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'customization': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'dry_cleaning': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'rental': ['pending', 'ready_for_pickup', 'picked_up', 'rented', 'returned', 'completed']
    };
    
    const flow = statusFlow[serviceType] || statusFlow['repair'];
    const currentIndex = flow.indexOf(currentStatus);
    
    if (currentIndex === -1 || currentIndex === flow.length - 1) {
      return null; // Already at final status or unknown status
    }
    
    return flow[currentIndex + 1];
  };

  // Get next status label for display
  const getNextStatusLabel = (currentStatus, serviceType = 'repair', item = null) => {
    const nextStatus = getNextStatus(currentStatus, serviceType, item);
    if (!nextStatus) return null;
    
    const labelMap = {
      'accepted': 'Accept',
      'price_confirmation': 'Price Confirm',
      'confirmed': 'Start Progress',
      'ready_for_pickup': 'Ready for Pickup',
      'completed': 'Complete',
      'picked_up': 'Mark Picked Up',
      'rented': 'Mark Rented',
      'returned': 'Mark Returned'
    };
    
    return labelMap[nextStatus] || getStatusText(nextStatus);
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
    item.approval_status === 'pending' ||
    item.approval_status === null || 
    item.approval_status === undefined ||
    item.approval_status === ''
  );

  const stats = {
    pending: pendingAppointments.length,
    accepted: allItems.filter(o => o.approval_status === 'accepted').length,
    inProgress: allItems.filter(o => o.approval_status === 'confirmed').length,
    toPickup: allItems.filter(o => o.approval_status === 'ready_for_pickup').length,
    completed: allItems.filter(o => o.approval_status === 'completed').length,
    rejected: allItems.filter(o => o.approval_status === 'cancelled').length
  };

  const getFilteredItems = () => {
    let items = [];
    
    if (viewFilter === "pending") {
      items = pendingAppointments;
    } else if (viewFilter === "accepted") {
      items = allItems.filter(item => item.approval_status === 'accepted');
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
        approvalStatus: 'accepted'  // Use 'accepted' instead of 'confirmed'
      });
      console.log("Accept result:", result);
      if (result.success) {
        console.log("Refreshing data...");
        await loadRepairOrders(); // Refresh data
        console.log("Data refreshed");
        await alert("Repair request accepted!", "Success", "success");
      } else {
        await alert(result.message || "Failed to accept repair request", "Error", "error");
      }
    } catch (err) {
      console.error("Accept error:", err);
      await alert("Failed to accept repair request", "Error", "error");
    }
  };

  const handleDecline = async (itemId) => {
    console.log("Declining item:", itemId);
    const confirmed = await confirm("Decline this repair request?", "Decline Repair", "warning");
    if (confirmed) {
      try {
        const result = await updateRepairOrderItem(itemId, {
          approvalStatus: 'cancelled'  // Use 'cancelled' instead of 'rejected'
        });
        console.log("Decline result:", result);
        if (result.success) {
          loadRepairOrders(); // Refresh data
        } else {
          await alert(result.message || "Failed to decline repair request", "Error", "error");
        }
      } catch (err) {
        console.error("Decline error:", err);
        await alert("Failed to decline repair request", "Error", "error");
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
        if (status === 'accepted') {
          setViewFilter('accepted');
        } else if (status === 'confirmed') {
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
          await alert(`Order #${item.order_id} status updated!`, "Success", "success");
        }
      } else {
        await alert(result.message || "Failed to update status", "Error", "error");
      }
    } catch (err) {
      await alert("Failed to update status", "Error", "error");
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

  // Helper to get estimated price for comparison
  const getEstimatedPrice = (item) => {
    if (!item || !item.specific_data) return null;
    const damageLevel = item.specific_data.damageLevel;
    const prices = {
      'minor': 300,
      'moderate': 500,
      'major': 800,
      'severe': 1200
    };
    return item.specific_data.estimatedPrice || prices[damageLevel] || null;
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
        await alert('Repair order updated successfully!', "Success", "success");
      } else {
        await alert(result.message || 'Failed to update repair order', "Error", "error");
      }
    } catch (err) {
      console.error("Frontend - Update error:", err);
      await alert('Failed to update repair order', "Error", "error");
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
              <span>Accepted</span>
              <div className="stat-icon" style={{ background: '#e1f5fe', color: '#039be5' }}>✓</div>
            </div>
            <div className="stat-number">{stats.accepted}</div>
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
      

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Unique No, Name, or Garment"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
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
                  <tr key={item.item_id} className="clickable-row" onClick={() => handleViewDetails(item)}>
                    <td><strong>#{item.order_id}</strong></td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.specific_data?.garmentType || 'N/A'}</td>
                    <td><span style={{ fontSize: '0.9em', color: '#d32f2f' }}>{item.specific_data?.serviceName || 'N/A'}</span></td>
                    <td><span style={{ fontSize: '0.8em' }}>{item.specific_data?.damageDescription?.substring(0, 50) || 'N/A'}...</span></td>
                    <td>{new Date(item.order_date).toLocaleDateString()}</td>
                    <td>₱{parseFloat(item.final_price || 0).toLocaleString()}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span className={`status-badge ${getStatusClass(item.approval_status || 'pending')}`}>
                        {getStatusText(item.approval_status || 'pending')}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {item.approval_status === 'pending_review' || item.approval_status === 'pending' || item.approval_status === null || item.approval_status === undefined || item.approval_status === '' ? (
                        <div className="action-buttons">
                          <button className="icon-btn accept" onClick={() => handleAccept(item.item_id)} title="Accept">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <button className="icon-btn decline" onClick={() => handleDecline(item.item_id)} title="Decline">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                          <button className="icon-btn edit" onClick={() => handleEditOrder(item)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          {getNextStatus(item.approval_status, 'repair', item) && (
                            <button 
                              className="icon-btn next-status" 
                              onClick={() => updateStatus(item.item_id, getNextStatus(item.approval_status, 'repair', item))} 
                              title={`Move to ${getNextStatusLabel(item.approval_status, 'repair', item)}`}
                              style={{ backgroundColor: '#4CAF50', color: 'white' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          )}
                          <button className="icon-btn edit" onClick={() => handleEditOrder(item)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
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
                  <div 
                    className="clickable-image" 
                    style={{ cursor: 'pointer', display: 'inline-block', marginTop: '8px' }}
                    onClick={() => openImagePreview(`http://localhost:5000${selectedOrder.specific_data.imageUrl}`, 'Damage Image')}
                  >
                    <img 
                      src={`http://localhost:5000${selectedOrder.specific_data.imageUrl}`} 
                      alt="Damage" 
                      style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <small className="click-hint" style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '4px' }}>Click to expand</small>
                  </div>
                </div>
              )}
              
              <div className="detail-row"><strong>Damage Description:</strong> {selectedOrder.specific_data?.damageDescription || 'N/A'}</div>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Final Price (₱)</label>
                <input 
                  type="number" 
                  value={editForm.finalPrice} 
                  onChange={(e) => {
                    const newPrice = e.target.value;
                    const estimatedPrice = getEstimatedPrice(selectedOrder);
                    const currentPrice = parseFloat(selectedOrder.final_price || 0);
                    
                    // If price is being changed and status is pending or accepted, auto-set to price_confirmation
                    let newStatus = editForm.approvalStatus;
                    if (newPrice && estimatedPrice && (editForm.approvalStatus === 'pending' || editForm.approvalStatus === 'accepted')) {
                      const priceChanged = Math.abs(parseFloat(newPrice) - estimatedPrice) > 0.01;
                      if (priceChanged) {
                        newStatus = 'price_confirmation';
                      }
                    }
                    
                    setEditForm({...editForm, finalPrice: newPrice, approvalStatus: newStatus});
                  }} 
                  placeholder="Enter final price" 
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                {(() => {
                  const estimatedPrice = getEstimatedPrice(selectedOrder);
                  if (estimatedPrice && editForm.finalPrice) {
                    const priceDiff = parseFloat(editForm.finalPrice) - estimatedPrice;
                    if (Math.abs(priceDiff) > 0.01) {
                      return (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.9em' }}>
                          <strong>⚠️ Price Changed:</strong> Estimated: ₱{estimatedPrice.toFixed(2)} → New: ₱{parseFloat(editForm.finalPrice).toFixed(2)}
                          <br />
                          <span style={{ color: '#666', fontSize: '0.85em' }}>Status will be set to "Price Confirmation" to notify customer.</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editForm.approvalStatus} 
                  onChange={(e) => setEditForm({...editForm, approvalStatus: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="price_confirmation">Price Confirmation</option>
                  <option value="confirmed">In Progress</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Rejected</option>
                </select>
                {editForm.approvalStatus === 'price_confirmation' && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9em', color: '#1976d2' }}>
                    ℹ️ Customer will be notified to confirm the updated price.
                  </div>
                )}
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
                  <div 
                    className="clickable-image" 
                    style={{ cursor: 'pointer', display: 'inline-block', marginTop: '8px' }}
                    onClick={() => openImagePreview(`http://localhost:5000${selectedOrder.specific_data.imageUrl}`, 'Damage Image')}
                  >
                    <img 
                      src={`http://localhost:5000${selectedOrder.specific_data.imageUrl}`} 
                      alt="Damage" 
                      style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <small className="click-hint" style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '4px' }}>Click to expand</small>
                  </div>
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        imageUrl={previewImageUrl}
        altText={previewImageAlt}
        onClose={closeImagePreview}
      />
    </div>
  );
};

export default Repair;
