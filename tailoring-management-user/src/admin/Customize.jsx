import React, { useState, useEffect } from 'react';
import '../adminStyle/customize.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getCustomizationOrders, updateCustomizationOrderItem } from '../api/CustomizationApi';

const Customize = () => {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewFilter, setViewFilter] = useState("all");
  const [detailModal, setDetailModal] = useState({ open: false, order: null });
  const [editMode, setEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [messageModal, setMessageModal] = useState({ open: false, orderId: null, message: "" });

  // Fetch customization orders
  useEffect(() => {
    fetchCustomizationOrders();
  }, []);

  const fetchCustomizationOrders = async () => {
    try {
      setLoading(true);
      const result = await getCustomizationOrders();
      
      if (result.success) {
        // Transform the data to match the existing structure
        const transformedItems = result.orders.map(order => {
          // Extract specific data from the order
          const specificData = order.specific_data || {};
          
          return {
            id: order.item_id,
            uniqueNo: `C${String(order.item_id).padStart(6, '0')}`,
            name: `${order.first_name} ${order.last_name}`,
            garment: specificData.garmentType || specificData.serviceName || 'Customization',
            date: order.appointment_date ? new Date(order.appointment_date).toISOString().split('T')[0] : new Date(order.order_date).toISOString().split('T')[0],
            price: parseFloat(order.final_price) || 0,
            isPending: order.approval_status === 'pending' || order.approval_status === 'pending_review',
            status: order.approval_status === 'pending' || order.approval_status === 'pending_review' ? 'Pending' : 
                   order.approval_status === 'accepted' ? 'In Progress' :
                   order.approval_status === 'in_progress' ? 'In Progress' :
                   order.approval_status === 'ready_for_pickup' || order.approval_status === 'ready_to_pickup' ? 'To Pick up' :
                   order.approval_status === 'completed' ? 'Completed' :
                   order.approval_status === 'cancelled' ? 'Cancelled' : 'Pending',
            measurements: {
              chest: specificData.chest || '',
              waist: specificData.waist || '',
              hips: specificData.hips || '',
              shoulders: specificData.shoulders || '',
              sleeves: specificData.sleeves || '',
              length: specificData.length || ''
            }
          };
        });
        
        setAllItems(transformedItems);
      } else {
        setError(result.message || 'Failed to fetch customization orders');
      }
    } catch (err) {
      setError('Failed to fetch customization orders');
      console.error('Error fetching customization orders:', err);
    } finally {
      setLoading(false);
    }
  };

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

    items = items.filter(item => {
      const matchesSearch = searchTerm === "" || 
        item.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    if (statusFilter && !items[0]?.isPending) {
      items = items.filter(item => item.status === statusFilter);
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  // Accept appointment
  const handleAccept = async (id) => {
    try {
      // Find the item in our local state
      const item = allItems.find(i => i.id === id);
      if (!item) return;
      
      // Update the order status via API
      const result = await updateCustomizationOrderItem(id, {
        approvalStatus: 'accepted'
      });
      
      if (result.success) {
        // Update local state
        setAllItems(allItems.map(item => 
          item.id === id 
            ? { ...item, isPending: false, status: "In Progress", uniqueNo: item.uniqueNo.replace('A', 'C') }
            : item
        ));
        alert(`Appointment accepted and converted to order!`);
      } else {
        alert(`Error accepting appointment: ${result.message}`);
      }
    } catch (err) {
      console.error('Error accepting appointment:', err);
      alert('Failed to accept appointment');
    }
  };

  // Decline appointment
  const handleDecline = (id) => {
    if (window.confirm("Are you sure you want to decline this appointment?")) {
      setAllItems(allItems.filter(item => item.id !== id));
      alert("Appointment declined and removed.");
    }
  };

  // Update status for accepted orders
  const updateStatus = async (orderId, newStatus) => {
    try {
      // Map UI status to backend status
      const statusMap = {
        'In Progress': 'in_progress',
        'To Pick up': 'ready_to_pickup',
        'Completed': 'completed',
        'Overdue': 'overdue',
        'Cancelled': 'cancelled'
      };
      
      const backendStatus = statusMap[newStatus] || newStatus.toLowerCase();
      
      // Update the order status via API
      const result = await updateCustomizationOrderItem(orderId, {
        approvalStatus: backendStatus
      });
      
      if (result.success) {
        // Update local state
        setAllItems(allItems.map(item => 
          item.id === orderId ? { ...item, status: newStatus } : item
        ));
        const item = allItems.find(o => o.id === orderId);
        if (item) {
          alert(`Order ${item.uniqueNo} status updated to ${newStatus}!`);
        }
      } else {
        alert(`Error updating status: ${result.message}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const viewDetails = (id) => {
    const item = allItems.find(o => o.id === id);
    if (item) {
      setDetailModal({ open: true, order: item });
      setEditedOrder(JSON.parse(JSON.stringify(item))); // Deep copy
      setEditMode(false);
    }
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleMeasurementChange = (field, value) => {
    setEditedOrder({
      ...editedOrder,
      measurements: {
        ...editedOrder.measurements,
        [field]: value
      }
    });
  };

  const handleSaveEdit = () => {
    setAllItems(allItems.map(item => 
      item.id === editedOrder.id ? editedOrder : item
    ));
    setDetailModal({ open: true, order: editedOrder });
    setEditMode(false);
    alert("Measurements updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditedOrder(JSON.parse(JSON.stringify(detailModal.order)));
    setEditMode(false);
  };

  const openMessageModal = (orderId) => {
    setMessageModal({ open: true, orderId, message: "" });
  };

  const handleSendMessage = () => {
    if (messageModal.message.trim() === "") {
      alert("Please enter a message.");
      return;
    }
    
    const order = allItems.find(o => o.id === messageModal.orderId);
    alert(`Message sent to ${order.name}:\n\n"${messageModal.message}"`);
    setMessageModal({ open: false, orderId: null, message: "" });
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
        
        {/* Loading and Error States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading customization orders...</p>
          </div>
        )}
        
        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            <p>Error: {error}</p>
            <button 
              onClick={fetchCustomizationOrders}
              style={{
                padding: '10px 20px',
                background: '#6A3C3E',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Retry
            </button>
          </div>
        )}

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
      {detailModal.open && editedOrder && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          onClick={() => {
            setDetailModal({ open: false, order: null });
            setEditMode(false);
          }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{detailModal.order?.isPending ? 'Appointment' : 'Order'} Details</h2>
              <span
                className="close-modal"
                onClick={() => {
                  setDetailModal({ open: false, order: null });
                  setEditMode(false);
                }}
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
                <span>{editedOrder.uniqueNo}</span>
              </div>
              <div className="detail-row">
                <strong>Customer Name:</strong>
                <span>{editedOrder.name}</span>
              </div>
              <div className="detail-row">
                <strong>Customization Details:</strong>
                <span>{editedOrder.garment}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{editedOrder.date}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                {editedOrder.isPending ? (
                  <span className="status-badge" style={{ background: '#fff3e0', color: '#f57c00' }}>
                    Pending Appointment
                  </span>
                ) : (
                  <span className={`status-badge ${getStatusBadgeClass(editedOrder.status)}`}>
                    {editedOrder.status}
                  </span>
                )}
              </div>

              {/* Measurements Section */}
              {!editedOrder.isPending && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <strong style={{ fontSize: '1.1rem' }}>Measurements (inches)</strong>
                    {!editMode && (
                      <button
                        onClick={handleEditToggle}
                        style={{
                          padding: '6px 12px',
                          background: '#6A3C3E',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.entries(editedOrder.measurements).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px', textTransform: 'capitalize' }}>
                          {key}:
                        </label>
                        {editMode ? (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleMeasurementChange(key, e.target.value)}
                            style={{
                              padding: '8px',
                              border: '2px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '0.95rem'
                            }}
                          />
                        ) : (
                          <span style={{ padding: '8px', background: 'white', borderRadius: '6px', fontSize: '0.95rem' }}>
                            {value || 'N/A'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {editMode && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '8px 16px',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: '8px 16px',
                          background: '#27AE60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {editedOrder.isPending ? (
                <>
                  <button
                    className="btn-save"
                    onClick={() => {
                      handleAccept(editedOrder.id);
                      setDetailModal({ open: false, order: null });
                      setEditMode(false);
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className="close-btn"
                    style={{ background: '#E74C3C' }}
                    onClick={() => {
                      handleDecline(editedOrder.id);
                      setDetailModal({ open: false, order: null });
                      setEditMode(false);
                    }}
                  >
                    Decline
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      openMessageModal(editedOrder.id);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    💬 Send Message
                  </button>
                  <button
                    className="close-btn"
                    onClick={() => {
                      setDetailModal({ open: false, order: null });
                      setEditMode(false);
                    }}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.open && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          onClick={() => setMessageModal({ open: false, orderId: null, message: "" })}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Send Message to Customer</h2>
              <span
                className="close-modal"
                onClick={() => setMessageModal({ open: false, orderId: null, message: "" })}
              >
                ×
              </span>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Notify the customer about material availability or other important information.
              </p>
              <textarea
                value={messageModal.message}
                onChange={(e) => setMessageModal({ ...messageModal, message: e.target.value })}
                placeholder="Type your message here... (e.g., 'The fabric you requested is currently unavailable. Would you like to choose an alternative?')"
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMessageModal({ open: false, orderId: null, message: "" })}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                style={{
                  padding: '10px 20px',
                  background: '#27AE60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                📤 Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customize;