import React, { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import '../adminStyle/rent.css';
import { getAllRentalOrders, getRentalOrdersByStatus, updateRentalOrderItem, recordRentalPayment } from '../api/RentalOrderApi';
import { useAlert } from '../context/AlertContext';

function Rental() {
  const { alert, confirm, prompt } = useAlert();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState('all'); // New view filter for tabs
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [editData, setEditData] = useState({
    approvalStatus: '',
    adminNotes: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');

  // Load rental orders from backend
  useEffect(() => {
    loadRentalOrders();
  }, []);

  const loadRentalOrders = async () => {
    setLoading(true);
    try {
      const result = await getAllRentalOrders();
      if (result.success) {
        // Ensure we're setting a fresh array to trigger React re-render
        setRentals([...result.orders]);
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
    ready_to_pickup: rentals.filter(r => 
      r.approval_status === 'ready_to_pickup' || 
      r.approval_status === 'ready_for_pickup' ||
      r.approval_status === 'accepted' // Treat accepted as ready_to_pickup for rentals
    ).length,
    rented: rentals.filter(r => r.approval_status === 'rented').length,
    returned: rentals.filter(r => r.approval_status === 'returned').length,
    rejected: rentals.filter(r => r.approval_status === 'cancelled').length
  };

  // Filter rentals based on view filter (tabs)
  const getFilteredRentalsByView = () => {
    switch (viewFilter) {
      case 'pending':
        return rentals.filter(r => r.approval_status === 'pending' || r.approval_status === 'pending_review');
      case 'ready-to-pickup':
        return rentals.filter(r => 
          r.approval_status === 'ready_to_pickup' || 
          r.approval_status === 'ready_for_pickup' ||
          r.approval_status === 'accepted' // Treat accepted as ready_to_pickup for rentals
        );
      case 'rented':
        return rentals.filter(r => r.approval_status === 'rented');
      case 'returned':
        return rentals.filter(r => r.approval_status === 'returned');
      case 'rejected':
        return rentals.filter(r => r.approval_status === 'cancelled');
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

    // Normalize status for filtering - treat 'accepted' as 'ready_to_pickup' since accepted doesn't exist in rental flow
    let normalizedStatus = rental.approval_status;
    if (rental.approval_status === 'pending_review') {
      normalizedStatus = 'pending';
    } else if (rental.approval_status === 'ready_for_pickup') {
      normalizedStatus = 'ready_to_pickup';
    } else if (rental.approval_status === 'accepted') {
      normalizedStatus = 'ready_to_pickup'; // Treat accepted as ready_to_pickup for rentals
    } else if (rental.approval_status === 'cancelled') {
      normalizedStatus = 'cancelled'; // Keep cancelled for filtering
    }

    const matchesStatus = !statusFilter || normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Accept rental - moves directly to ready_to_pickup
  const handleAccept = async (rental) => {
    const confirmed = await confirm(`Accept rental order ORD-${rental.order_id}?`, 'Accept Rental', 'warning');
    if (!confirmed) return;

    try {
      const result = await updateRentalOrderItem(rental.item_id, {
        approvalStatus: 'ready_to_pickup'
      });

      if (result.success) {
        await alert('Rental accepted! Status changed to "Ready to Pick Up"', 'Success', 'success');
        await loadRentalOrders();
      } else {
        await alert(result.message || 'Failed to accept rental', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error accepting rental:', error);
      await alert('Error accepting rental', 'Error', 'error');
    }
  };

  // Handle Decline rental
  const handleDecline = async (rental) => {
    try {
      console.log('[DECLINE] Button clicked for rental:', rental.item_id, rental);
      
      const reason = await prompt('Please enter reason for declining this rental:', 'Decline Rental', 'Enter reason...');
      console.log('[DECLINE] Prompt returned:', reason);
      
      if (reason === null || reason === undefined) {
        console.log('[DECLINE] User cancelled the prompt');
        return; // User cancelled
      }
      
      if (!reason || reason.trim() === '') {
        console.log('[DECLINE] Empty reason provided');
        await alert('Please provide a reason for declining the rental', 'Warning', 'warning');
        return; // Empty reason
      }

      console.log('[DECLINE] Updating rental with reason:', reason.trim());
      const result = await updateRentalOrderItem(rental.item_id, {
        approvalStatus: 'cancelled',
        adminNotes: `Declined: ${reason.trim()}`
      });

      console.log('[DECLINE] Update result:', result);

      if (result.success) {
        await alert('Rental declined and cancelled', 'Success', 'success');
        await loadRentalOrders();
      } else {
        await alert(result.message || 'Failed to decline rental', 'Error', 'error');
      }
    } catch (error) {
      console.error('[DECLINE] Error declining rental:', error);
      await alert(`Error declining rental: ${error.message || 'Unknown error'}`, 'Error', 'error');
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
        await alert(`Rental status updated to "${getStatusLabel(editData.approvalStatus)}"`, 'Success', 'success');
        setShowEditModal(false);
        await loadRentalOrders();
      } else {
        await alert(result.message || 'Failed to update rental', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error updating rental:', error);
      await alert('Error updating rental', 'Error', 'error');
    }
  };

  const handleStatusUpdate = async (itemId, newStatus) => {
    const confirmed = await confirm(`Update status to "${getStatusLabel(newStatus)}"?`, 'Update Status', 'warning');
    if (!confirmed) return;

    try {
      const result = await updateRentalOrderItem(itemId, {
        approvalStatus: newStatus
      });

      if (result.success) {
        await alert(`Status updated to "${getStatusLabel(newStatus)}"`, 'Success', 'success');
        // Reload orders after a brief delay to ensure state updates properly
        setTimeout(() => {
          loadRentalOrders();
        }, 100);
      } else {
        await alert(result.message || 'Failed to update status', 'Error', 'error');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      await alert('Error updating status', 'Error', 'error');
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedRental || !paymentAmount) {
      await alert('Please enter a payment amount', 'Error', 'error');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      await alert('Please enter a valid payment amount', 'Error', 'error');
      return;
    }

    try {
      const result = await recordRentalPayment(selectedRental.item_id, amount);
      if (result.success) {
        await alert(`Payment of ₱${amount.toFixed(2)} recorded successfully. Remaining balance: ₱${result.payment.remaining_balance.toFixed(2)}`, 'Success', 'success');
        setShowPaymentModal(false);
        setPaymentAmount('');
        await loadRentalOrders();
      } else {
        await alert(result.message || 'Failed to record payment', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      await alert('Error recording payment', 'Error', 'error');
    }
  };

  const getStatusClass = (status) => {
    // For rentals, treat 'accepted' as 'ready_to_pickup' since accepted status doesn't exist in rental flow
    let normalizedStatus = status === 'accepted' ? 'ready_to_pickup' : status;
    // Also normalize ready_for_pickup to ready_to_pickup
    normalizedStatus = normalizedStatus === 'ready_for_pickup' ? 'ready_to_pickup' : normalizedStatus;
    // Map 'cancelled' to 'rejected' for display
    normalizedStatus = normalizedStatus === 'cancelled' ? 'rejected' : normalizedStatus;
    
    const statusMap = {
      'pending': 'pending',
      'pending_review': 'pending',
      'ready_to_pickup': 'ready-to-pickup',
      'ready_for_pickup': 'ready-to-pickup',
      'picked_up': 'picked-up',
      'rented': 'rented',
      'returned': 'returned',
      'completed': 'completed',
      'cancelled': 'rejected',
      'rejected': 'rejected'
    };
    return statusMap[normalizedStatus] || 'unknown';
  };

  const getStatusLabel = (status) => {
    // For rentals, normalize status - treat 'accepted' and 'ready_for_pickup' as 'ready_to_pickup'
    let normalizedStatus = status === 'accepted' ? 'ready_to_pickup' : status;
    normalizedStatus = normalizedStatus === 'ready_for_pickup' ? 'ready_to_pickup' : normalizedStatus;
    // Map 'cancelled' to 'Rejected' for display
    normalizedStatus = normalizedStatus === 'cancelled' ? 'rejected' : normalizedStatus;
    
    const labelMap = {
      'pending': 'Pending',
      'pending_review': 'Pending',
      'ready_to_pickup': 'Ready to Pick Up',
      'ready_for_pickup': 'Ready to Pick Up',
      'picked_up': 'Picked Up',
      'rented': 'Rented',
      'returned': 'Returned',
      'completed': 'Completed',
      'cancelled': 'Rejected',
      'rejected': 'Rejected'
    };
    return labelMap[normalizedStatus] || normalizedStatus;
  };

  // Get next status in workflow
  const getNextStatus = (currentStatus, serviceType = 'rental') => {
    // For rental service type, use simplified flow
    if (serviceType === 'rental') {
      // Handle null/undefined/empty status
      if (!currentStatus || currentStatus === 'pending_review' || currentStatus === 'pending') {
        return 'ready_to_pickup';
      }
      
      // Normalize status variants to standard form
      let normalizedStatus = currentStatus;
      if (currentStatus === 'ready_for_pickup' || currentStatus === 'accepted') {
        normalizedStatus = 'ready_to_pickup';
      }
      
      // Rental flow: pending → ready_to_pickup → rented → returned
      if (normalizedStatus === 'ready_to_pickup') {
        return 'rented';
      } else if (normalizedStatus === 'rented') {
        return 'returned';
      } else if (normalizedStatus === 'returned') {
        return 'completed';
      }
      return null; // Already at final status or unknown status
    }
    
    // For other service types
    const statusFlow = {
      'repair': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'customization': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed'],
      'dry_cleaning': ['pending', 'accepted', 'price_confirmation', 'confirmed', 'ready_for_pickup', 'completed']
    };
    
    const flow = statusFlow[serviceType];
    if (!flow) return null;
    
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
    
    // Map next status to action label
    const labelMap = {
      'price_confirmation': 'Price Confirm',
      'confirmed': 'Start Progress',
      'ready_for_pickup': 'Ready for Pickup',
      'ready_to_pickup': 'Ready for Pickup',
      'completed': 'Complete',
      'picked_up': 'Mark Picked Up',
      'rented': 'Mark Rented',
      'returned': 'Mark Returned'
    };
    
    // Return the label for the next status, or use getStatusLabel as fallback
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
            <option value="cancelled">Rejected</option>
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
                  <th>Payment Status</th>
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
                    const downpaymentAmount = rental.pricing_factors?.downpayment || rental.specific_data?.downpayment || 0;
                    // Get amount paid and remaining balance
                    const pricingFactors = typeof rental.pricing_factors === 'string' 
                      ? JSON.parse(rental.pricing_factors || '{}') 
                      : (rental.pricing_factors || {});
                    const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
                    const finalPrice = parseFloat(rental.final_price || 0);
                    const remainingBalance = finalPrice - amountPaid;

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
                        <td style={{
                          textDecoration: rental.approval_status === 'cancelled' ? 'line-through' : 'none',
                          color: rental.approval_status === 'cancelled' ? '#999' : 'inherit'
                        }}>
                          ₱{finalPrice.toLocaleString()}
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            <div>Paid: ₱{amountPaid.toLocaleString()}</div>
                            <div style={{ color: remainingBalance > 0 ? '#ff9800' : '#4caf50', fontWeight: 'bold' }}>
                              Remaining: ₱{Math.max(0, remainingBalance).toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <span 
                            className={`status-badge ${getStatusClass(rental.approval_status || 'pending')}`}
                            style={{ 
                              display: 'inline-block',
                              visibility: 'visible',
                              opacity: 1,
                              minWidth: '120px',
                              textAlign: 'center'
                            }}
                          >
                            {getStatusLabel(rental.approval_status || 'pending')}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            {/* Show move to next status button for all statuses */}
                            {(() => {
                              const currentStatus = rental.approval_status || 'pending';
                              const nextStatus = getNextStatus(currentStatus, 'rental');
                              if (!nextStatus) return null;
                              const nextStatusLabel = getNextStatusLabel(currentStatus, 'rental');
                              return (
                                <button 
                                  className="icon-btn next-status" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(rental.item_id, nextStatus);
                                  }} 
                                  title={`Move to ${nextStatusLabel}`}
                                  style={{ backgroundColor: '#4CAF50', color: 'white', zIndex: 10 }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                  </svg>
                                </button>
                              );
                            })()}
                            {/* Show decline button only for pending rentals */}
                            {isPending && (
                              <button 
                                className="icon-btn decline" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[DECLINE] Button clicked, isPending:', isPending, 'rental:', rental);
                                  handleDecline(rental).catch(err => {
                                    console.error('[DECLINE] Unhandled error:', err);
                                    alert('An unexpected error occurred while declining the rental', 'Error', 'error');
                                  });
                                }} 
                                title="Decline"
                                type="button"
                                style={{ cursor: 'pointer', zIndex: 10, position: 'relative' }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            )}
                            {/* Show record payment button only if not rejected/cancelled */}
                            {rental.approval_status !== 'cancelled' && (
                              <button 
                                className="icon-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRental(rental);
                                  setPaymentAmount('');
                                  setShowPaymentModal(true);
                                }} 
                                title="Record Payment"
                                style={{ backgroundColor: '#2196F3', color: 'white' }}
                              >
                                💰
                              </button>
                            )}
                            <button className="icon-btn edit" onClick={() => handleEditClick(rental)} title="Edit">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
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
                  <option value="rented">Rented</option>
                  <option value="returned">Returned</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Rejected</option>
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

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedRental && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) setShowPaymentModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <span className="close-modal" onClick={() => setShowPaymentModal(false)}>×</span>
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
                <strong>Total Price:</strong>
                <span style={{
                  textDecoration: selectedRental.approval_status === 'cancelled' ? 'line-through' : 'none',
                  color: selectedRental.approval_status === 'cancelled' ? '#999' : 'inherit'
                }}>
                  ₱{parseFloat(selectedRental.final_price || 0).toLocaleString()}
                </span>
              </div>
              {(() => {
                const pricingFactors = typeof selectedRental.pricing_factors === 'string' 
                  ? JSON.parse(selectedRental.pricing_factors || '{}') 
                  : (selectedRental.pricing_factors || {});
                const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
                const finalPrice = parseFloat(selectedRental.final_price || 0);
                const remaining = finalPrice - amountPaid;
                return (
                  <>
                    <div className="detail-row">
                      <strong>Amount Paid:</strong>
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                        ₱{amountPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Remaining Balance:</strong>
                      <span style={{ color: remaining > 0 ? '#ff9800' : '#4caf50', fontWeight: 'bold' }}>
                        ₱{Math.max(0, remaining).toLocaleString()}
                      </span>
                    </div>
                  </>
                );
              })()}
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Payment Amount *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="form-control"
                  placeholder="Enter payment amount"
                  min="0"
                  step="0.01"
                  autoFocus
                />
                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                  Enter the amount the customer is paying now
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => {
                setShowPaymentModal(false);
                setPaymentAmount('');
              }}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleRecordPayment}>
                Record Payment
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
                <span style={{ 
                  color: selectedRental.approval_status === 'cancelled' ? '#999' : '#2e7d32', 
                  fontWeight: 'bold',
                  textDecoration: selectedRental.approval_status === 'cancelled' ? 'line-through' : 'none'
                }}>
                  ₱{parseFloat(selectedRental.final_price || 0).toLocaleString()}
                </span>
              </div>
              {(() => {
                const pricingFactors = typeof selectedRental.pricing_factors === 'string' 
                  ? JSON.parse(selectedRental.pricing_factors || '{}') 
                  : (selectedRental.pricing_factors || {});
                const amountPaid = parseFloat(pricingFactors.amount_paid || 0);
                const finalPrice = parseFloat(selectedRental.final_price || 0);
                const remaining = finalPrice - amountPaid;
                return (
                  <>
                    <div className="detail-row">
                      <strong>Amount Paid:</strong>
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                        ₱{amountPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Remaining Balance:</strong>
                      <span style={{ color: remaining > 0 ? '#ff9800' : '#4caf50', fontWeight: 'bold' }}>
                        ₱{Math.max(0, remaining).toLocaleString()}
                        {remaining <= 0 && finalPrice > 0 && ' (Fully Paid)'}
                      </span>
                    </div>
                  </>
                );
              })()}
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