import React, { useState } from 'react';
import '../adminStyle/bill.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

const Billing = () => {
  const initialBills = [
    {
      id: 1,
      uniqueNo: "C223111",
      customerName: "Juan Dela Cruz",
      serviceType: "Customization",
      date: "2024-11-25",
      price: 1200,
      status: "Unpaid"
    },
    {
      id: 2,
      uniqueNo: "D223112",
      customerName: "Ana Garcia",
      serviceType: "Dry Cleaning",
      date: "2024-11-26",
      price: 500,
      status: "Paid"
    },
    {
      id: 3,
      uniqueNo: "R223113",
      customerName: "Maria Santos",
      serviceType: "Repair",
      date: "2024-11-20",
      price: 800,
      status: "Paid"
    },
    {
      id: 4,
      uniqueNo: "RN244222",
      customerName: "Ben Santos",
      serviceType: "Rental",
      date: "2024-11-18",
      price: 1500,
      status: "Unpaid"
    },
    {
      id: 5,
      uniqueNo: "C244333",
      customerName: "Sofia Santos",
      serviceType: "Customization",
      date: "2024-11-15",
      price: 2500,
      status: "Paid"
    },
    {
      id: 6,
      uniqueNo: "D244444",
      customerName: "Carlos Santos",
      serviceType: "Dry Cleaning",
      date: "2024-11-10",
      price: 750,
      status: "Unpaid"
    }
  ];

  const [allBills, setAllBills] = useState(initialBills);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Calculate statistics
  const stats = {
    total: allBills.length,
    paid: allBills.filter(b => b.status === 'Paid').length,
    unpaid: allBills.filter(b => b.status === 'Unpaid').length,
    totalRevenue: allBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.price, 0),
    pendingRevenue: allBills.filter(b => b.status === 'Unpaid').reduce((sum, b) => sum + b.price, 0)
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
      bills = bills.filter(bill => bill.serviceType === serviceFilter);
    }

    return bills;
  };

  const filteredBills = getFilteredBills();

  // Update payment status
  const updatePaymentStatus = (billId, newStatus) => {
    setAllBills(allBills.map(bill => 
      bill.id === billId ? { ...bill, status: newStatus } : bill
    ));
    const bill = allBills.find(b => b.id === billId);
    if (bill) {
      alert(`Payment status for ${bill.uniqueNo} updated to ${newStatus}!`);
    }
  };

  const handleViewDetails = (id) => {
    const bill = allBills.find(b => b.id === id);
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  const getServiceTypeColor = (serviceType) => {
    const colors = {
      'Customization': '#9c27b0',
      'Dry Cleaning': '#2196f3',
      'Repair': '#ff9800',
      'Rental': '#4caf50'
    };
    return colors[serviceType] || '#666';
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
            <div className="stat-number">{stats.total}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Paid</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>✓</div>
            </div>
            <div className="stat-number">{stats.paid}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Unpaid</span>
              <div className="stat-icon" style={{ background: '#ffebee', color: '#f44336' }}>⚠</div>
            </div>
            <div className="stat-number">{stats.unpaid}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Total Revenue</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>💰</div>
            </div>
            <div className="stat-number" style={{ fontSize: '28px' }}>
              ₱{stats.totalRevenue.toLocaleString()}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Pending</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>⏳</div>
            </div>
            <div className="stat-number" style={{ fontSize: '28px' }}>
              ₱{stats.pendingRevenue.toLocaleString()}
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
            <option value="Unpaid">Unpaid</option>
          </select>

          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="">All Services</option>
            <option value="Customization">Customization</option>
            <option value="Dry Cleaning">Dry Cleaning</option>
            <option value="Repair">Repair</option>
            <option value="Rental">Rental</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
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
                filteredBills.map(bill => (
                  <tr key={bill.id}>
                    <td><strong>{bill.uniqueNo}</strong></td>
                    <td>{bill.customerName}</td>
                    <td>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'white',
                        backgroundColor: getServiceTypeColor(bill.serviceType)
                      }}>
                        {bill.serviceType}
                      </span>
                    </td>
                    <td>{bill.date}</td>
                    <td style={{ fontWeight: '600', color: '#2e7d32' }}>
                      ₱{bill.price.toLocaleString()}
                    </td>
                    <td>
                      <select
                        className={`status-select ${bill.status.toLowerCase()}`}
                        value={bill.status}
                        onChange={(e) => updatePaymentStatus(bill.id, e.target.value)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          backgroundColor: bill.status === 'Paid' ? '#e8f5e9' : '#ffebee',
                          color: bill.status === 'Paid' ? '#2e7d32' : '#d32f2f'
                        }}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleViewDetails(bill.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: getServiceTypeColor(selectedBill.serviceType)
                }}>
                  {selectedBill.serviceType}
                </span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{selectedBill.date}</span>
              </div>
              <div className="detail-row">
                <strong>Price:</strong>
                <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '18px' }}>
                  ₱{selectedBill.price.toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Payment Status:</strong>
                <span className={`status-badge ${selectedBill.status.toLowerCase()}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    backgroundColor: selectedBill.status === 'Paid' ? '#e8f5e9' : '#ffebee',
                    color: selectedBill.status === 'Paid' ? '#2e7d32' : '#d32f2f'
                  }}
                >
                  {selectedBill.status}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              {selectedBill.status === 'Unpaid' && (
                <button 
                  className="btn-save"
                  onClick={() => {
                    updatePaymentStatus(selectedBill.id, 'Paid');
                    setShowDetailModal(false);
                  }}
                >
                  Mark as Paid
                </button>
              )}
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;