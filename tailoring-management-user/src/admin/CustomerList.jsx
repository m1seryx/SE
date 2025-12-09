import React, { useState, useEffect } from 'react';
import '../adminStyle/dryclean.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllCustomers, updateCustomer, updateCustomerStatus, getCustomerById, getMeasurements, saveMeasurements } from '../api/CustomerApi';
import { getUserRole } from '../api/AuthApi';
import { useAlert } from '../context/AlertContext';

const CustomerList = () => {
  const { alert, confirm } = useAlert();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    status: 'active'
  });
  const [measurements, setMeasurements] = useState({
    top: {},
    bottom: {},
    notes: ''
  });
  const [measurementsLoading, setMeasurementsLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await getAllCustomers();
      if (result.success) {
        setCustomers(result.customers || []);
      } else {
        setError(result.message || 'Failed to load customers');
      }
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async (customer) => {
    const result = await getCustomerById(customer.user_id);
    if (result.success) {
      setSelectedCustomer(result.customer);
      setEditForm({
        first_name: result.customer.first_name || '',
        last_name: result.customer.last_name || '',
        email: result.customer.email || '',
        phone_number: result.customer.phone_number || '',
        status: result.customer.status || 'active'
      });
      
      // Load measurements if available
      if (result.measurements) {
        setMeasurements({
          top: typeof result.measurements.top_measurements === 'string' 
            ? JSON.parse(result.measurements.top_measurements) 
            : result.measurements.top_measurements || {},
          bottom: typeof result.measurements.bottom_measurements === 'string'
            ? JSON.parse(result.measurements.bottom_measurements)
            : result.measurements.bottom_measurements || {},
          notes: result.measurements.notes || ''
        });
      } else {
        // Try to fetch measurements separately
        setMeasurementsLoading(true);
        const measResult = await getMeasurements(customer.user_id);
        if (measResult.success && measResult.measurements) {
          setMeasurements({
            top: typeof measResult.measurements.top_measurements === 'string' 
              ? JSON.parse(measResult.measurements.top_measurements) 
              : measResult.measurements.top_measurements || {},
            bottom: typeof measResult.measurements.bottom_measurements === 'string'
              ? JSON.parse(measResult.measurements.bottom_measurements)
              : measResult.measurements.bottom_measurements || {},
            notes: measResult.measurements.notes || ''
          });
        } else {
          setMeasurements({ top: {}, bottom: {}, notes: '' });
        }
        setMeasurementsLoading(false);
      }
      
      setShowEditModal(true);
    } else {
      await alert(result.message || 'Failed to load customer details', 'Error', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;

    try {
      // Update customer info
      const result = await updateCustomer(selectedCustomer.user_id, editForm);
      if (result.success) {
        // Save measurements if they exist
        const hasMeasurements = Object.keys(measurements.top).length > 0 || 
                                Object.keys(measurements.bottom).length > 0 || 
                                measurements.notes.trim() !== '';
        
        if (hasMeasurements) {
          const measResult = await saveMeasurements(selectedCustomer.user_id, measurements);
          if (!measResult.success) {
            console.error('Failed to save measurements:', measResult.message);
          }
        }
        
        await alert('Customer updated successfully!', 'Success', 'success');
        setShowEditModal(false);
        loadCustomers();
      } else {
        await alert(result.message || 'Failed to update customer', 'Error', 'error');
      }
    } catch (err) {
      await alert('Failed to update customer', 'Error', 'error');
      console.error(err);
    }
  };

  const handleStatusChange = async (customerId, newStatus) => {
    try {
      const result = await updateCustomerStatus(customerId, newStatus);
      if (result.success) {
        await alert('Customer status updated successfully!', 'Success', 'success');
        loadCustomers();
      } else {
        await alert(result.message || 'Failed to update status', 'Error', 'error');
      }
    } catch (err) {
      await alert('Failed to update status', 'Error', 'error');
      console.error(err);
    }
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const matchesSearch = 
        `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number?.includes(searchTerm);
      
      const matchesStatus = !statusFilter || customer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getStatusClass = (status) => {
    return status === 'active' ? 'accepted' : 'rejected';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="admin-page">
      <Sidebar />
      <AdminHeader />
      
      <div className="content">
        <div className="dashboard-title">
          <div>
            <h2>Customer List</h2>
            <p>Manage customer information and status</p>
          </div>
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
        </div>

        {/* Search and Filter */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Total Orders</th>
                <th>Date Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading customers...</td></tr>
              ) : getFilteredCustomers().length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No customers found</td></tr>
              ) : (
                getFilteredCustomers().map(customer => (
                  <tr key={customer.user_id}>
                    <td><strong>{customer.first_name} {customer.last_name}</strong></td>
                    <td>{customer.email || 'N/A'}</td>
                    <td>{customer.phone_number || 'N/A'}</td>
                    <td>{customer.total_orders || 0}</td>
                    <td>{formatDate(customer.created_at)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(customer.status || 'active')}`}>
                        {(customer.status || 'active').charAt(0).toUpperCase() + (customer.status || 'active').slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer); }} title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        {(customer.status === 'active' || !customer.status || customer.status === null) ? (
                          <button 
                            className="icon-btn decline" 
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              const confirmed = await confirm(`Are you sure you want to deactivate ${customer.first_name} ${customer.last_name}?`, 'Confirm Deactivation', 'warning');
                              if (confirmed) {
                                handleStatusChange(customer.user_id, 'inactive');
                              }
                            }} 
                            title="Deactivate"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        ) : (
                          <button 
                            className="icon-btn accept" 
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              const confirmed = await confirm(`Are you sure you want to activate ${customer.first_name} ${customer.last_name}?`, 'Confirm Activation', 'warning');
                              if (confirmed) {
                                handleStatusChange(customer.user_id, 'active');
                              }
                            }} 
                            title="Activate"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Customer</h2>
              <span className="close-modal" onClick={() => setShowEditModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Customer Measurements Section */}
              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', color: '#333' }}>Customer Measurements</h3>
                
                {/* Top Measurements */}
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333', fontSize: '16px' }}>Top Measurements</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Chest (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.top.chest || ''}
                        onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, chest: e.target.value } })}
                        placeholder="Enter chest measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Shoulders (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.top.shoulders || ''}
                        onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, shoulders: e.target.value } })}
                        placeholder="Enter shoulder measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sleeve Length (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.top.sleeve_length || ''}
                        onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, sleeve_length: e.target.value } })}
                        placeholder="Enter sleeve length"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Neck (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.top.neck || ''}
                        onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, neck: e.target.value } })}
                        placeholder="Enter neck measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Waist (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.top.waist || ''}
                        onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, waist: e.target.value } })}
                        placeholder="Enter waist measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Length (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.top.length || ''}
                        onChange={(e) => setMeasurements({ ...measurements, top: { ...measurements.top, length: e.target.value } })}
                        placeholder="Enter length measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Measurements */}
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333', fontSize: '16px' }}>Bottom Measurements</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Waist (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.bottom.waist || ''}
                        onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, waist: e.target.value } })}
                        placeholder="Enter waist measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Hips (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.bottom.hips || ''}
                        onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, hips: e.target.value } })}
                        placeholder="Enter hip measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Inseam (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.bottom.inseam || ''}
                        onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, inseam: e.target.value } })}
                        placeholder="Enter inseam measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Length (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.bottom.length || ''}
                        onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, length: e.target.value } })}
                        placeholder="Enter length measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Thigh (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.bottom.thigh || ''}
                        onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, thigh: e.target.value } })}
                        placeholder="Enter thigh measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Outseam (inches)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements.bottom.outseam || ''}
                        onChange={(e) => setMeasurements({ ...measurements, bottom: { ...measurements.bottom, outseam: e.target.value } })}
                        placeholder="Enter outseam measurement"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>Measurement Notes</label>
                  <textarea
                    value={measurements.notes}
                    onChange={(e) => setMeasurements({ ...measurements, notes: e.target.value })}
                    placeholder="Add any additional notes about measurements..."
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;

