import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../adminStyle/customize.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllCustomizationOrders, updateCustomizationOrderItem } from '../api/CustomizationApi';
import { getUserRole } from '../api/AuthApi';
import ImagePreviewModal from '../components/ImagePreviewModal';

// Helper to check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};


const Customize = () => {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    finalPrice: '',
    approvalStatus: '',
    adminNotes: ''
  });

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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


  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };


  const openConfirmModal = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };


  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setShowConfirmModal(false);
    setConfirmAction(null);
  };


  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      setError('Please log in to access this page');
      navigate('/login');
      return;
    }
    const role = getUserRole();
    if (role !== 'admin') {
      setError('Admin access required');
      navigate('/');
      return;
    }
  }, [navigate]);


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


  // Load customization orders on component mount
  useEffect(() => {
    if (isAuthenticated() && getUserRole() === 'admin') {
      loadCustomizationOrders();
    }
  }, []);


  const loadCustomizationOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllCustomizationOrders();
      if (result.success) {
        setAllItems(result.orders);
      } else {
        setError(result.message || 'Failed to load customization orders');
      }
    } catch (err) {
      console.error("Load error:", err);
      setError('Failed to load customization orders');
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
      item.specific_data?.fabricType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    // Apply status filter only for "all" tab
    if (statusFilter && viewFilter === 'all') {
      items = items.filter(item => item.approval_status === statusFilter);
    }


    return items;
  };


  const handleAccept = async (itemId) => {
    try {
      const result = await updateCustomizationOrderItem(itemId, {
        approvalStatus: 'accepted'
      });
      if (result.success) {
        await loadCustomizationOrders();
        showToast("Customization request accepted!", "success");
      } else {
        showToast(result.message || "Failed to accept request", "error");
      }
    } catch (err) {
      console.error("Accept error:", err);
      showToast("Failed to accept request", "error");
    }
  };


  const handleDecline = (itemId) => {
    openConfirmModal("Are you sure you want to decline this customization request?", async () => {
      try {
        const result = await updateCustomizationOrderItem(itemId, {
          approvalStatus: 'cancelled'
        });
        if (result.success) {
          loadCustomizationOrders();
          showToast("Request declined", "success");
        } else {
          showToast(result.message || "Failed to decline request", "error");
        }
      } catch (err) {
        console.error("Decline error:", err);
        showToast("Failed to decline request", "error");
      }
    });
  };


  const updateStatus = async (itemId, status) => {
    try {
      const result = await updateCustomizationOrderItem(itemId, {
        approvalStatus: status
      });
      if (result.success) {
        await loadCustomizationOrders();


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
          showToast(`Order #${item.order_id} status updated!`, "success");
        }
      } else {
        showToast(result.message || "Failed to update status", "error");
      }
    } catch (err) {
      showToast("Failed to update status", "error");
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
      const result = await updateCustomizationOrderItem(selectedOrder.item_id, editForm);


      if (result.success) {
        setShowEditModal(false);
        loadCustomizationOrders();
        showToast('Order updated successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to update order', 'error');
      }
    } catch (err) {
      console.error("Update error:", err);
      showToast('Failed to update order', 'error');
    }
  };


  return (
    <div className="customization-management">
      <Sidebar />
      <AdminHeader />


      <div className="content">
        <div className="dashboard-title">
          <div>
            <h2>Customization Management</h2>
            <p>Track and manage all customization orders</p>
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


        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Order ID, Name, Garment, or Fabric"
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
                <th>Fabric</th>
                <th>Date</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Loading customization orders...</td></tr>
              ) : getFilteredItems().length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No customization orders found</td></tr>
              ) : (
                getFilteredItems().map(item => (
                  <tr key={item.item_id} className="clickable-row" onClick={() => handleViewDetails(item)}>
                    <td><strong>#{item.order_id}</strong></td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.specific_data?.garmentType || 'N/A'}</td>
                    <td><span style={{ fontSize: '0.9em', color: '#5D4037' }}>{item.specific_data?.fabricType || 'N/A'}</span></td>
                    <td>{new Date(item.order_date).toLocaleDateString()}</td>
                    <td>₱{parseFloat(item.final_price || 0).toLocaleString()}</td>
                    <td onClick={(e) => e.stopPropagation()}>
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
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="price_confirmation">Price Confirmation</option>
                          <option value="confirmed">In Progress</option>
                          <option value="ready_for_pickup">To Pick up</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Rejected</option>
                        </select>
                      )}
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
                          <button className="icon-btn edit" onClick={() => handleEditOrder(item)} title="Update">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => handleEditOrder(item)} title="Update">
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


      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update Customization Order</h2>
              <span className="close-modal" onClick={() => setShowEditModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Order ID:</strong> #{selectedOrder.order_id}</div>
              <div className="detail-row"><strong>Garment:</strong> {selectedOrder.specific_data?.garmentType || 'N/A'}</div>
              <div className="detail-row"><strong>Fabric:</strong> {selectedOrder.specific_data?.fabricType || 'N/A'}</div>


              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Final Price (₱)</label>
                <input
                  type="number"
                  value={editForm.finalPrice}
                  onChange={(e) => setEditForm({ ...editForm, finalPrice: e.target.value })}
                  placeholder="Enter final price"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>


              <div className="form-group">
                <label>Status</label>
                <select
                  value={editForm.approvalStatus}
                  onChange={(e) => setEditForm({ ...editForm, approvalStatus: e.target.value })}
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
              </div>


              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
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
              <h2>Order Details</h2>
              <span className="close-modal" onClick={() => setShowDetailModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row"><strong>Order ID:</strong> #{selectedOrder.order_id}</div>
              <div className="detail-row"><strong>Customer:</strong> {selectedOrder.first_name} {selectedOrder.last_name}</div>
              <div className="detail-row"><strong>Email:</strong> {selectedOrder.email}</div>
              <div className="detail-row"><strong>Garment:</strong> {selectedOrder.specific_data?.garmentType || 'N/A'}</div>
              <div className="detail-row"><strong>Fabric:</strong> {selectedOrder.specific_data?.fabricType || 'N/A'}</div>
              <div className="detail-row"><strong>Preferred Date:</strong> {selectedOrder.specific_data?.preferredDate || 'N/A'}</div>
              <div className="detail-row"><strong>Date Received:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</div>
              <div className="detail-row"><strong>Price:</strong> ₱{parseFloat(selectedOrder.final_price || 0).toLocaleString()}</div>
              <div className="detail-row"><strong>Status:</strong>
                <span className={`status-badge ${getStatusClass(selectedOrder.approval_status || 'pending')}`}>
                  {getStatusText(selectedOrder.approval_status || 'pending')}
                </span>
              </div>

              {selectedOrder.specific_data?.notes && (
                <div className="detail-row"><strong>Customer Notes:</strong> {selectedOrder.specific_data.notes}</div>
              )}

              {selectedOrder.pricing_factors?.adminNotes && (
                <div className="detail-row"><strong>Admin Notes:</strong> {selectedOrder.pricing_factors.adminNotes}</div>
              )}

              {/* Show design preview image */}
              {selectedOrder.specific_data?.imageUrl && selectedOrder.specific_data.imageUrl !== 'no-image' && (
                <div className="detail-row">
                  <strong>Design Preview:</strong>
                  <div 
                    className="clickable-image"
                    style={{ marginTop: '10px', cursor: 'pointer' }}
                    onClick={() => openImagePreview(`http://localhost:5000${selectedOrder.specific_data.imageUrl}`, 'Design preview')}
                  >
                    <img
                      src={`http://localhost:5000${selectedOrder.specific_data.imageUrl}`}
                      alt="Design preview"
                      style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <small className="click-hint" style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '4px' }}>Click to expand</small>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}


      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowConfirmModal(false)}>
          <div className="confirm-modal">
            <div className="confirm-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3>Confirm Action</h3>
            <p>{confirmMessage}</p>
            <div className="confirm-buttons">
              <button className="confirm-btn cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="confirm-btn confirm" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}


      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
          <span>{toast.message}</span>
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


export default Customize;
