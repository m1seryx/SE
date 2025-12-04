import React, { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import '../adminStyle/rent.css';
import { getAllRentalOrders, getRentalOrdersByStatus, updateRentalOrderItem } from '../api/RentalOrderApi';

function Rental() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState('all'); // New view filter for tabs
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [editData, setEditData] = useState({
    approvalStatus: '',
    adminNotes: ''
  });

  // Load rental orders from backend
  useEffect(() => {
    loadRentalOrders();
  }, []);

  const loadRentalOrders = async () => {
    setLoading(true);
    try {
      const result = await getAllRentalOrders();
      if (result.success) {
        setRentals(result.orders);
      } else {
        console.error('Failed to load rental orders:', result.message);
      }
    } catch (error) {
      console.error('Error loading rental orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pending: rentals.filter(r => r.approval_status === 'pending' || r.approval_status === 'pending_review').length,
    ready_to_pickup: rentals.filter(r => r.approval_status === 'ready_to_pickup' || r.approval_status === 'ready_for_pickup').length,
    rented: rentals.filter(r => r.approval_status === 'rented').length,
    returned: rentals.filter(r => r.approval_status === 'returned').length
  };

  // Filter rentals based on view filter (tabs)
  const getFilteredRentalsByView = () => {
    switch (viewFilter) {
      case 'pending':
        return rentals.filter(r => r.approval_status === 'pending' || r.approval_status === 'pending_review');
      case 'ready-to-pickup':
        return rentals.filter(r => r.approval_status === 'ready_to_pickup' || r.approval_status === 'ready_for_pickup');
      case 'rented':
        return rentals.filter(r => r.approval_status === 'rented');
      case 'returned':
        return rentals.filter(r => r.approval_status === 'returned');
      default:
        return rentals;
    }
  };

  const filteredRentals = getFilteredRentalsByView().filter(rental => {
    const matchesSearch =
      rental.item_id?.toString().includes(searchTerm) ||
      rental.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.specific_data?.item_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Normalize status for filtering
    let normalizedStatus = rental.approval_status;
    if (rental.approval_status === 'pending_review') {
      normalizedStatus = 'pending';
    } else if (rental.approval_status === 'ready_for_pickup') {
      normalizedStatus = 'ready_to_pickup';
    }

    const matchesStatus = !statusFilter || normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Accept rental
  const handleAccept = async (rental) => {
    if (!confirm(`Accept rental order ORD-${rental.order_id}?`)) return;

    try {
      const result = await updateRentalOrderItem(rental.item_id, {
        approvalStatus: 'ready_to_pickup'
      });

      if (result.success) {
        alert('Rental accepted! Status changed to "Ready to Pick Up"');
        await loadRentalOrders();
      } else {
        alert(result.message || 'Failed to accept rental');
      }
    } catch (error) {
      console.error('Error accepting rental:', error);
      alert('Error accepting rental');
    }
  };

  // Handle Decline rental
  const handleDecline = async (rental) => {
    const reason = prompt('Please enter reason for declining this rental:');
    if (reason === null) return; // User cancelled

    try {
      const result = await updateRentalOrderItem(rental.item_id, {
        approvalStatus: 'cancelled',
        adminNotes: `Declined: ${reason}`
      });

      if (result.success) {
        alert('Rental declined and cancelled');
        await loadRentalOrders();
      } else {
        alert(result.message || 'Failed to decline rental');
      }
    } catch (error) {
      console.error('Error declining rental:', error);
      alert('Error declining rental');
    }
  };

  const handleViewDetails = (rental) => {
    setSelectedRental(rental);
    setShowDetailModal(true);
  };

  const handleEditClick = (rental) => {
    setSelectedRental(rental);
    setEditData({
      approvalStatus: rental.approval_status,
      adminNotes: rental.specific_data?.adminNotes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRental) return;

    try {
      const result = await updateRentalOrderItem(selectedRental.item_id, {
        approvalStatus: editData.approvalStatus,
        adminNotes: editData.adminNotes
      });

      if (result.success) {
        alert(`Rental status updated to "${getStatusLabel(editData.approvalStatus)}"`);
        setShowEditModal(false);
        await loadRentalOrders();
      } else {
        alert(result.message || 'Failed to update rental');
      }
    } catch (error) {
      console.error('Error updating rental:', error);
      alert('Error updating rental');
    }
  };

  const handleStatusUpdate = async (itemId, newStatus) => {
    console.log("Frontend - Updating rental status:", itemId, "to", newStatus);

    if (!confirm(`Update status to "${getStatusLabel(newStatus)}"?`)) return;

    try {
      const result = await updateRentalOrderItem(itemId, {
        approvalStatus: newStatus
      });

      console.log("Frontend - Update result:", result);

      if (result.success) {
        alert(`Status updated to "${getStatusLabel(newStatus)}"`);
        await loadRentalOrders();
      } else {
        alert(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert('Error updating status');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'pending': 'pending',
      'pending_review': 'pending',
      'ready_to_pickup': 'ready-to-pickup',
      'ready_for_pickup': 'ready-to-pickup',
      'picked_up': 'picked-up',
      'rented': 'rented',
      'returned': 'returned',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'unknown';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      'pending': 'Pending',
      'pending_review': 'Pending',
      'ready_to_pickup': 'Ready to Pick Up',
      'ready_for_pickup': 'Ready to Pick Up',
      'picked_up': 'Picked Up',
      'rented': 'Rented',
      'returned': 'Returned',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return labelMap[status] || status;
  };

  return (
    <div className="rental-page">
      <Sidebar />
      <AdminHeader />

      <div className="content">
        <div className="dashboard-title">
          <h2>Rental Management</h2>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Pending</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>📋</div>
            </div>
            <div className="stat-number">{stats.pending}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Ready to Pick Up</span>
              <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2196f3' }}>📦</div>
            </div>
            <div className="stat-number">{stats.ready_to_pickup}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Rented</span>
              <div className="stat-icon" style={{ background: '#f3e5f5', color: '#9c27b0' }}>🎭</div>
            </div>
            <div className="stat-number">{stats.rented}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Returned</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>✓</div>
            </div>
            <div className="stat-number">{stats.returned}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="view-tabs">
          <button className={viewFilter === 'all' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('all')}>
            All ({rentals.length})
          </button>
          <button className={viewFilter === 'pending' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('pending')}>
            Pending ({stats.pending})
          </button>
          <button className={viewFilter === 'ready-to-pickup' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('ready-to-pickup')}>
            Ready to Pick Up ({stats.ready_to_pickup})
          </button>
          <button className={viewFilter === 'rented' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('rented')}>
            Rented ({stats.rented})
          </button>
          <button className={viewFilter === 'returned' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewFilter('returned')}>
            Returned ({stats.returned})
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by ID, Name, or Item"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="ready_to_pickup">Ready to Pick Up</option>
            <option value="rented">Rented</option>
            <option value="returned">Returned</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              Loading rental orders...
            </div>
          ) : (
            <table>
              <thead>
                <tr className="tr-rental">
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Rented Item</th>
                  <th>Rental Period</th>
                  <th>Total Price</th>
                  <th>Deposit Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRentals.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      No rental orders found
                    </td>
                  </tr>
                ) : (
                  filteredRentals.map(rental => {
                    const isPending = rental.approval_status === 'pending' || rental.approval_status === 'pending_review';
                    const depositAmount = rental.pricing_factors?.deposit_amount || rental.specific_data?.deposit_amount || 0;

                    return (
                      <tr key={rental.item_id}>
                        <td><strong>ORD-{rental.order_id}</strong></td>
                        <td>{rental.first_name} {rental.last_name}</td>
                        <td>{rental.specific_data?.item_name || 'N/A'}</td>
                        <td>
                          {rental.rental_start_date && rental.rental_end_date
                            ? `${rental.rental_start_date} to ${rental.rental_end_date}`
                            : 'N/A'}
                        </td>
                        <td>₱{parseFloat(rental.final_price || 0).toLocaleString()}</td>
                        <td>₱{parseFloat(depositAmount).toLocaleString()}</td>
                        <td>
                          {isPending ? (
                            <span className={`status-badge ${getStatusClass(rental.approval_status)}`}>
                              {getStatusLabel(rental.approval_status)}
                            </span>
                          ) : (
                            <select
                              className={`status-select ${getStatusClass(rental.approval_status)}`}
                              value={rental.approval_status}
                              onChange={(e) => handleStatusUpdate(rental.item_id, e.target.value)}
                            >
                              <option value="ready_for_pickup">Ready to Pick Up</option>
                              <option value="picked_up">Picked Up</option>
                              <option value="rented">Rented</option>
                              <option value="returned">Returned</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {isPending ? (
                              <>
                                <button
                                  className="action-btn accept"
                                  onClick={() => handleAccept(rental)}
                                  style={{
                                    padding: '5px 10px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    background: '#4CAF50',
                                    color: 'white'
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  className="action-btn decline"
                                  onClick={() => handleDecline(rental)}
                                  style={{
                                    padding: '5px 10px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    background: '#E74C3C',
                                    color: 'white'
                                  }}
                                >
                                  Decline
                                </button>
                                <button
                                  className="action-btn"
                                  onClick={() => handleViewDetails(rental)}
                                  style={{
                                    padding: '5px 10px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    background: '#2196f3',
                                    color: 'white'
                                  }}
                                >
                                  View
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="action-btn edit"
                                  onClick={() => handleEditClick(rental)}
                                  style={{
                                    padding: '5px 10px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    background: '#ff9800',
                                    color: 'white'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="action-btn"
                                  onClick={() => handleViewDetails(rental)}
                                  style={{
                                    padding: '5px 10px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    background: '#2196f3',
                                    color: 'white'
                                  }}
                                >
                                  View
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && selectedRental && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) setShowEditModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Rental Order</h2>
              <span className="close-modal" onClick={() => setShowEditModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Order ID:</strong>
                <span>ORD-{selectedRental.order_id}</span>
              </div>
              <div className="detail-row">
                <strong>Customer:</strong>
                <span>{selectedRental.first_name} {selectedRental.last_name}</span>
              </div>
              <div className="detail-row">
                <strong>Item:</strong>
                <span>{selectedRental.specific_data?.item_name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Current Status:</strong>
                <span className={`status-badge ${getStatusClass(selectedRental.approval_status)}`}>
                  {getStatusLabel(selectedRental.approval_status)}
                </span>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Update Status</label>
                <select
                  value={editData.approvalStatus}
                  onChange={(e) => setEditData({ ...editData, approvalStatus: e.target.value })}
                  className="form-control"
                >
                  <option value="ready_for_pickup">Ready to Pick Up</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="rented">Rented</option>
                  <option value="returned">Returned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Admin Notes (Optional)</label>
                <textarea
                  value={editData.adminNotes}
                  onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Add any notes about this rental..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showDetailModal && selectedRental && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) setShowDetailModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rental Details</h2>
              <span className="close-modal" onClick={() => setShowDetailModal(false)}>×</span>
            </div>
            <div className="modal-body">
              {selectedRental.specific_data?.image_url && (
                <div className="detail-row">
                  <strong>Item Photo:</strong>
                  <img
                    src={selectedRental.specific_data.image_url}
                    alt="Rental Item"
                    className="item-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="detail-row">
                <strong>Order ID:</strong>
                <span>ORD-{selectedRental.order_id}</span>
              </div>
              <div className="detail-row">
                <strong>Customer:</strong>
                <span>{selectedRental.first_name} {selectedRental.last_name}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedRental.email}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{selectedRental.phone_number || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Rented Item:</strong>
                <span>{selectedRental.specific_data?.item_name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{selectedRental.specific_data?.category || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Brand:</strong>
                <span>{selectedRental.specific_data?.brand || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Size:</strong>
                <span>{selectedRental.specific_data?.size || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Rental Period:</strong>
                <span>
                  {selectedRental.duration_days 
                    ? `${selectedRental.duration_days} day${selectedRental.duration_days !== 1 ? 's' : ''} rental`
                    : (selectedRental.rental_start_date && selectedRental.rental_end_date
                      ? `${selectedRental.rental_start_date} to ${selectedRental.rental_end_date}`
                      : 'N/A')}
                </span>
              </div>
              <div className="detail-row">
                <strong>Order Date:</strong>
                <span>{selectedRental.order_date || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Total Price:</strong>
                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  ₱{parseFloat(selectedRental.final_price || 0).toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Deposit Amount:</strong>
                <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
                  ₱{parseFloat(selectedRental.pricing_factors?.deposit_amount || selectedRental.specific_data?.deposit_amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${getStatusClass(selectedRental.approval_status)}`}>
                  {getStatusLabel(selectedRental.approval_status)}
                </span>
              </div>
              {selectedRental.specific_data?.notes && (
                <div className="detail-row">
                  <strong>Customer Notes:</strong>
                  <span>{selectedRental.specific_data.notes}</span>
                </div>
              )}
              {selectedRental.specific_data?.adminNotes && (
                <div className="detail-row">
                  <strong>Admin Notes:</strong>
                  <span>{selectedRental.specific_data.adminNotes}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rental;