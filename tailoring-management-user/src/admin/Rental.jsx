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
    accepted: rentals.filter(r => r.approval_status === 'accepted').length,
    ready_to_pickup: rentals.filter(r => r.approval_status === 'ready_to_pickup' || r.approval_status === 'ready_for_pickup').length,
    rented: rentals.filter(r => r.approval_status === 'rented').length,
    returned: rentals.filter(r => r.approval_status === 'returned').length
  };

  // Filter rentals based on view filter (tabs)
  const getFilteredRentalsByView = () => {
    switch (viewFilter) {
      case 'pending':
        return rentals.filter(r => r.approval_status === 'pending' || r.approval_status === 'pending_review');
      case 'accepted':
        return rentals.filter(r => r.approval_status === 'accepted');
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
        approvalStatus: 'accepted'
      });

      if (result.success) {
        alert('Rental accepted! Status changed to "Accepted"');
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
      'accepted': 'accepted',
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
      'accepted': 'Accepted',
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

  // Get next status in workflow
  const getNextStatus = (currentStatus, serviceType = 'rental') => {
    if (!currentStatus || currentStatus === 'pending_review' || currentStatus === 'pending') {
      return 'accepted';
    }
    
    const statusFlow = {
      'repair': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'customization': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'dry_cleaning': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'rental': ['pending', 'accepted', 'ready_for_pickup', 'picked_up', 'rented', 'returned', 'completed']
    };
    
    const flow = statusFlow[serviceType] || statusFlow['rental'];
    const currentIndex = flow.indexOf(currentStatus);
    
    if (currentIndex === -1 || currentIndex === flow.length - 1) {
      return null; // Already at final status or unknown status
    }
    
    return flow[currentIndex + 1];
  };

  // Get next status label for display
  const getNextStatusLabel = (currentStatus, serviceType = 'rental') => {
    const nextStatus = getNextStatus(currentStatus, serviceType);
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
    
    return labelMap[nextStatus] || getStatusLabel(nextStatus);
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
              <span>Accepted</span>
              <div className="stat-icon" style={{ background: '#e1f5fe', color: '#039be5' }}>✓</div>
            </div>
            <div className="stat-number">{stats.accepted}</div>
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
            <option value="accepted">Accepted</option>
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
                      <tr key={rental.item_id} className="clickable-row" onClick={() => handleViewDetails(rental)}>
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
                        <td onClick={(e) => e.stopPropagation()}>
                          <span className={`status-badge ${getStatusClass(rental.approval_status)}`}>
                            {getStatusLabel(rental.approval_status)}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {isPending ? (
                            <div className="action-buttons">
                              <button className="icon-btn accept" onClick={() => handleAccept(rental)} title="Accept">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </button>
                              <button className="icon-btn decline" onClick={() => handleDecline(rental)} title="Decline">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                              <button className="icon-btn edit" onClick={() => handleEditClick(rental)} title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons">
                              {getNextStatus(rental.approval_status, 'rental') && (
                                <button 
                                  className="icon-btn next-status" 
                                  onClick={() => handleStatusUpdate(rental.item_id, getNextStatus(rental.approval_status, 'rental'))} 
                                  title={`Move to ${getNextStatusLabel(rental.approval_status, 'rental')}`}
                                  style={{ backgroundColor: '#4CAF50', color: 'white' }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                  </svg>
                                </button>
                              )}
                              <button className="icon-btn edit" onClick={() => handleEditClick(rental)} title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                            </div>
                          )}
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
                  <option value="accepted">Accepted</option>
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
                  {selectedRental.rental_start_date && selectedRental.rental_end_date
                    ? `${selectedRental.rental_start_date} to ${selectedRental.rental_end_date}`
                    : 'N/A'}
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