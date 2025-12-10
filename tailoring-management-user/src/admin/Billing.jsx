import React, { useState, useEffect } from 'react';
import '../adminStyle/bill.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllBillingRecords, getBillingStats, updateBillingRecordStatus } from '../api/BillingApi';
import { useAlert } from '../context/AlertContext';
import ImagePreviewModal from '../components/ImagePreviewModal';

const Billing = () => {
  const { alert } = useAlert();
  const [allBills, setAllBills] = useState([]);
  const [billingStats, setBillingStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [imagePreview, setImagePreview] = useState({ isOpen: false, imageUrl: '', altText: '' });

  // Fetch billing data on component mount and refresh periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch billing records
        const recordsResponse = await getAllBillingRecords();
        if (recordsResponse.success) {
          setAllBills(recordsResponse.records);
        }

        // Fetch billing statistics
        const statsResponse = await getBillingStats();
        if (statsResponse.success) {
          setBillingStats(statsResponse.stats);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh billing data every 5 seconds to catch automatic updates
    const refreshInterval = setInterval(fetchData, 5000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Calculate statistics from local data (fallback)
  const localStats = {
    total: allBills.length,
    paid: allBills.filter(b => b.status === 'Paid' || b.status === 'Fully Paid').length,
    unpaid: allBills.filter(b => b.status === 'Unpaid' || b.status === 'Down-payment').length,
    totalRevenue: allBills.filter(b => b.status === 'Paid' || b.status === 'Fully Paid').reduce((sum, b) => sum + b.price, 0),
    pendingRevenue: allBills.filter(b => b.status === 'Unpaid' || b.status === 'Down-payment').reduce((sum, b) => sum + b.price, 0)
  };

  // Filter logic
  const getFilteredBills = () => {
    let bills = allBills;

    // Apply search filter
    bills = bills.filter(bill => {
      const matchesSearch = searchTerm === "" || 
        bill.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // Apply status filter
    if (statusFilter) {
      bills = bills.filter(bill => bill.status === statusFilter);
    }

    // Apply service type filter
    if (serviceFilter) {
      bills = bills.filter(bill => (bill.serviceTypeDisplay || bill.serviceType) === serviceFilter);
    }

    return bills;
  };

  const filteredBills = getFilteredBills();

  // Get next payment status for a bill
  const getNextPaymentStatus = (bill) => {
    const serviceType = (bill.serviceType || '').toLowerCase();
    const currentStatus = bill.status;

    // For rental: down-payment → fully paid
    if (serviceType === 'rental') {
      if (currentStatus === 'Down-payment') {
        return 'Fully Paid';
      }
      return 'Down-payment';
    }

    // For other services: unpaid → paid
    if (currentStatus === 'Unpaid') {
      return 'Paid';
    }
    return 'Unpaid';
  };

  // Update payment status (manual override)
  const updatePaymentStatus = async (billId, newStatus) => {
    try {
      const response = await updateBillingRecordStatus(billId, newStatus);
      if (response.success) {
        // Refresh all billing data to get latest from server
        const recordsResponse = await getAllBillingRecords();
        if (recordsResponse.success) {
          setAllBills(recordsResponse.records);
        }
        const statsResponse = await getBillingStats();
        if (statsResponse.success) {
          setBillingStats(statsResponse.stats);
        }
        
        const bill = allBills.find(b => b.id === billId);
        if (bill) {
          await alert(`Payment status for ${bill.uniqueNo} manually updated to ${newStatus}!`, 'Success', 'success');
        } else {
          await alert(`Payment status updated to ${newStatus}!`, 'Success', 'success');
        }
      } else {
        await alert(response.message || 'Failed to update payment status', 'Error', 'error');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      await alert('Error updating payment status', 'Error', 'error');
    }
  };

  const handleViewDetails = (id) => {
    const bill = allBills.find(b => b.id === id);
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  const openImagePreview = (imageUrl, altText) => {
    setImagePreview({ isOpen: true, imageUrl, altText });
  };

  const closeImagePreview = () => {
    setImagePreview({ isOpen: false, imageUrl: '', altText: '' });
  };

  // Get service image URL
  const getServiceImageUrl = (bill) => {
    if (!bill.specificData) return null;
    
    const imageUrl = bill.specificData.imageUrl;
    if (!imageUrl || imageUrl === 'no-image') return null;

    // Handle both relative and absolute URLs
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `http://localhost:5000${imageUrl}`;
  };

  // Get service description
  const getServiceDescription = (bill) => {
    if (!bill.specificData) return null;
    const data = bill.specificData;
    const serviceType = (bill.serviceType || '').toLowerCase();

    if (serviceType === 'rental') {
      // For rental, show item name and description
      const bundleItems = data.bundle_items || [];
      if (bundleItems.length > 0) {
        return bundleItems.map(item => `${item.name || 'Rental Item'} - ${item.description || 'No description'}`).join(', ');
      }
      return data.name || data.description || 'Rental service';
    } else if (serviceType === 'dry_cleaning' || serviceType === 'dry-cleaning' || serviceType === 'drycleaning') {
      return `${data.garmentType || 'Garment'} - Brand: ${data.brand || 'N/A'} - Quantity: ${data.quantity || 1}`;
    } else if (serviceType === 'repair') {
      return `${data.serviceName || 'Repair'} - ${data.damageDescription || 'No description'}`;
    } else if (serviceType === 'customization' || serviceType === 'customize') {
      return `${data.garmentType || 'Custom'} - ${data.fabricType || 'N/A'} fabric`;
    }

    return data.description || data.notes || 'Service details';
  };

  // Get rental price display
  const getRentalPriceDisplay = (bill) => {
    if ((bill.serviceType || '').toLowerCase() !== 'rental') {
      return `₱${bill.price.toLocaleString()}`;
    }

    // For rental, show down payment and full price
    // Check multiple possible field names for down payment
    const downPayment = bill.pricingFactors?.downpayment || 
                       bill.pricingFactors?.down_payment || 
                       bill.pricingFactors?.downPayment ||
                       bill.specificData?.downpayment ||
                       0;
    const fullPrice = bill.price || 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '14px' }}>Down Payment: ₱{parseFloat(downPayment).toLocaleString()}</span>
        <span style={{ fontSize: '14px' }}>Full Price: ₱{parseFloat(fullPrice).toLocaleString()}</span>
      </div>
    );
  };

  // Get service type color
  const getServiceTypeColor = (serviceType) => {
    const colors = {
      'Customization': '#9c27b0', // Purple
      'Dry Cleaning': '#2196f3',   // Blue
      'Repair': '#ff9800',        // Orange
      'Rental': '#4caf50',        // Green
      'Alteration': '#f44336',    // Red
      'Consultation': '#795548',  // Brown
      'Other': '#607d8b'          // Blue Grey
    };
    return colors[serviceType] || '#666';
  };

  // Get status button style
  const getStatusButtonStyle = (status) => {
    const styles = {
      'Paid': { backgroundColor: '#e8f5e9', color: '#2e7d32' },
      'Fully Paid': { backgroundColor: '#c8e6c9', color: '#1b5e20' },
      'Unpaid': { backgroundColor: '#ffebee', color: '#d32f2f' },
      'Down-payment': { backgroundColor: '#fff3e0', color: '#e65100' }
    };
    return styles[status] || styles['Unpaid'];
  };

  return (
    <div className="billing-management">
      <Sidebar />
      <AdminHeader />
      
      <div className="content">
        <div className="dashboard-title">
          <div>
            <h2>Billing Management</h2>
            <p>Track payments and manage billing</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Total Bills</span>
              <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2196f3' }}>📄</div>
            </div>
            <div className="stat-number">{billingStats.total || localStats.total}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Paid</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>✓</div>
            </div>
            <div className="stat-number">{billingStats.paid || localStats.paid}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Unpaid</span>
              <div className="stat-icon" style={{ background: '#ffebee', color: '#f44336' }}>⚠</div>
            </div>
            <div className="stat-number">{billingStats.unpaid || localStats.unpaid}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Total Revenue</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>💰</div>
            </div>
            <div className="stat-number" style={{ fontSize: '28px' }}>
              ₱{(billingStats.totalRevenue || localStats.totalRevenue).toLocaleString()}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Pending</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>⏳</div>
            </div>
            <div className="stat-number" style={{ fontSize: '28px' }}>
              ₱{(billingStats.pendingRevenue || localStats.pendingRevenue).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Unique No. or Customer Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Payment Status</option>
            <option value="Paid">Paid</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Down-payment">Down-payment</option>
          </select>

          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="">All Services</option>
            <option value="Customization">Customization</option>
            <option value="Dry Cleaning">Dry Cleaning</option>
            <option value="Repair">Repair</option>
            <option value="Rental">Rental</option>
            <option value="Alteration">Alteration</option>
            <option value="Consultation">Consultation</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              Loading billing records...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Unique No.</th>
                  <th>Customer Name</th>
                  <th>Service Type</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                      No bills found
                    </td>
                  </tr>
                ) : (
                  filteredBills.map(bill => {
                    const nextStatus = getNextPaymentStatus(bill);
                    const statusStyle = getStatusButtonStyle(bill.status);
                    
                    return (
                      <tr key={bill.id}>
                        <td><strong>{bill.uniqueNo}</strong></td>
                        <td>{bill.customerName}</td>
                        <td>
                          <span className="service-type-badge" data-service-type={(bill.serviceType || '').toLowerCase()}>
                            {bill.serviceTypeDisplay || bill.serviceType}
                          </span>
                        </td>
                        <td>{bill.date}</td>
                      <td style={{ fontWeight: '600', color: '#2e7d32' }}>
                        {getRentalPriceDisplay(bill)}
                      </td>
                      <td>
                        <span className={`status-badge ${bill.status.toLowerCase().replace(' ', '-')}`}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontWeight: '600',
                            fontSize: '14px',
                            display: 'inline-block',
                            ...statusStyle
                          }}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          <button 
                            className="icon-btn next-status" 
                            onClick={async (e) => {
                              e.stopPropagation();
                              await updatePaymentStatus(bill.id, nextStatus);
                            }} 
                            title={`Manually move to ${nextStatus} (Note: Payment status auto-updates when service status changes in management pages)`}
                            style={{ backgroundColor: '#4CAF50', color: 'white', zIndex: 10 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(bill.id);
                            }}
                          >
                            View
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

      {/* View Details Modal */}
      {showDetailModal && selectedBill && (
        <div 
          className="modal-overlay active" 
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) setShowDetailModal(false);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Bill Details</h2>
              <span className="close-modal" onClick={() => setShowDetailModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Unique No:</strong>
                <span>{selectedBill.uniqueNo}</span>
              </div>
              <div className="detail-row">
                <strong>Customer Name:</strong>
                <span>{selectedBill.customerName}</span>
              </div>
              <div className="detail-row">
                <strong>Service Type:</strong>
                <span className="service-type-badge" data-service-type={(selectedBill.serviceType || '').toLowerCase()}>
                  {selectedBill.serviceTypeDisplay || selectedBill.serviceType}
                </span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{selectedBill.date}</span>
              </div>
              <div className="detail-row">
                <strong>Price:</strong>
                <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '18px' }}>
                  {getRentalPriceDisplay(selectedBill)}
                </span>
              </div>
              <div className="detail-row">
                <strong>Payment Status:</strong>
                <span className={`status-badge ${selectedBill.status.toLowerCase().replace(' ', '-')}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    ...getStatusButtonStyle(selectedBill.status)
                  }}
                >
                  {selectedBill.status}
                </span>
              </div>

              {/* Service Description */}
              {getServiceDescription(selectedBill) && (
                <div className="detail-row">
                  <strong>Description:</strong>
                  <span>{getServiceDescription(selectedBill)}</span>
                </div>
              )}

              {/* Service Image */}
              {getServiceImageUrl(selectedBill) && (
                <div className="detail-row">
                  <strong>Service Image:</strong>
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={getServiceImageUrl(selectedBill)}
                      alt="Service"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '300px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => openImagePreview(getServiceImageUrl(selectedBill), `${selectedBill.serviceTypeDisplay || selectedBill.serviceType} Image`)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <small style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '4px' }}>
                      Click to enlarge
                    </small>
                  </div>
                </div>
              )}

              {/* Rental specific details */}
              {(selectedBill.serviceType || '').toLowerCase() === 'rental' && (
                <>
                  {selectedBill.rentalStartDate && (
                    <div className="detail-row">
                      <strong>Rental Start Date:</strong>
                      <span>{new Date(selectedBill.rentalStartDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedBill.rentalEndDate && (
                    <div className="detail-row">
                      <strong>Rental End Date:</strong>
                      <span>{new Date(selectedBill.rentalEndDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-save"
                onClick={async () => {
                  const nextStatus = getNextPaymentStatus(selectedBill);
                  await updatePaymentStatus(selectedBill.id, nextStatus);
                  setShowDetailModal(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Mark as {getNextPaymentStatus(selectedBill)}
              </button>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        imageUrl={imagePreview.imageUrl}
        altText={imagePreview.altText}
        onClose={closeImagePreview}
      />
    </div>
  );
};

export default Billing;
