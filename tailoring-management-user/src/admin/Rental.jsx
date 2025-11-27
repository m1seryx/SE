import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import '../adminStyle/rent.css';

function Rental() {
  const [rentals, setRentals] = useState([
    { id: 1, uniqueNo: "RN223111", name: "Maria Santos", rentedItem: "Black Fitted Barong", category: "Barong", date: "2025-04-18", price: 2500, status: "Rented" },
    { id: 2, uniqueNo: "RN223112", name: "Ben Santos", rentedItem: "White Barong", category: "Barong", date: "2025-04-19", price: 2200, status: "Rented" },
    { id: 3, uniqueNo: "RN223113", name: "Marie Jane", rentedItem: "Black Evening Gown", category: "Gown", date: "2025-04-10", price: 5000, status: "Returned" },
    { id: 4, uniqueNo: "RN223114", name: "Jane Santos", rentedItem: "Red Formal Slacks", category: "Slacks", date: "2025-04-12", price: 1800, status: "Overdue" },
    { id: 5, uniqueNo: "RN223115", name: "Mark Santos", rentedItem: "Navy Blue Suit", category: "Suit", date: "2025-04-19", price: 4500, status: "Rented" }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  
  const [newRental, setNewRental] = useState({
    name: '',
    rentedItem: '',
    category: 'Barong',
    price: '',
    status: 'Rented'
  });

  const generateUniqueNo = () => {
    return 'RN' + Date.now().toString().slice(-6);
  };

  const stats = {
    rented: rentals.filter(r => r.status === 'Rented').length,
    overdue: rentals.filter(r => r.status === 'Overdue').length,
    returned: rentals.filter(r => r.status === 'Returned').length
  };

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = 
      rental.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.rentedItem.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || rental.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddRental = () => {
    if (!newRental.name || !newRental.rentedItem || !newRental.price || parseFloat(newRental.price) <= 0) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const rental = {
      id: Date.now(),
      uniqueNo: generateUniqueNo(),
      name: newRental.name,
      rentedItem: newRental.rentedItem,
      category: newRental.category,
      date: new Date().toISOString().split('T')[0],
      price: parseFloat(newRental.price),
      status: newRental.status
    };

    setRentals([...rentals, rental]);
    setShowAddModal(false);
    setNewRental({ name: '', rentedItem: '', category: 'Barong', price: '', status: 'Rented' });
    alert('New rental added successfully!');
  };

  const handleStatusChange = (id, newStatus) => {
    const rental = rentals.find(r => r.id === id);
    const oldStatus = rental?.status;
    
    setRentals(rentals.map(rental => 
      rental.id === id ? { ...rental, status: newStatus } : rental
    ));
    
    if (rental) {
      alert(`Rental ${rental.uniqueNo} status changed from "${oldStatus}" to "${newStatus}"`);
    }
  };

  const handleViewDetails = (rental) => {
    setSelectedRental(rental);
    setShowDetailModal(true);
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replace(' ', '-');
  };

  return (
    <div className="rental-page">
      <Sidebar />
      <AdminHeader />
      
      <div className="content">
        <div className="dashboard-title">
          <h2>Rental Management</h2>
          <p>Track rental items and manage returns</p>
          <button className="add-rep" onClick={() => setShowAddModal(true)}>
            Add Rental +
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Rented</span>
              <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2196f3' }}>📦</div>
            </div>
            <div className="stat-number">{stats.rented}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Overdue</span>
              <div className="stat-icon" style={{ background: '#ffebee', color: '#f44336' }}>⚠</div>
            </div>
            <div className="stat-number">{stats.overdue}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Returned</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50'}}>✓</div>
            </div>
            <div className="stat-number">{stats.returned}</div>
          </div>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Unique No., Name, or Item"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Rented">Rented</option>
            <option value="Returned">Returned</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr classname="tr-rental">
                <th>Unique No.</th>
                <th>Name</th>
                <th>Rented Item</th>
                <th>Category</th>
                <th>Rental Date</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                    No rentals found
                  </td>
                </tr>
              ) : (
                filteredRentals.map(rental => (
                  <tr key={rental.id}>
                    <td><strong>{rental.uniqueNo}</strong></td>
                    <td>{rental.name}</td>
                    <td>{rental.rentedItem}</td>
                    <td>{rental.category}</td>
                    <td>{rental.date}</td>
                    <td>₱{rental.price.toLocaleString()}</td>
                    <td>
                      <select
                        className={`status-select ${getStatusClass(rental.status)}`}
                        value={rental.status}
                        onChange={(e) => handleStatusChange(rental.id, e.target.value)}
                      >
                        <option value="Rented">Rented</option>
                        <option value="Returned">Returned</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => handleViewDetails(rental)}>
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

      {/* ADD RENTAL MODAL */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) setShowAddModal(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Rental</h2>
              <span className="close-modal" onClick={() => setShowAddModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={newRental.name}
                  onChange={(e) => setNewRental({ ...newRental, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Rented Item</label>
                <input
                  type="text"
                  placeholder="e.g. Black Fitted Barong"
                  value={newRental.rentedItem}
                  onChange={(e) => setNewRental({ ...newRental, rentedItem: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newRental.category}
                  onChange={(e) => setNewRental({ ...newRental, category: e.target.value })}
                >
                  <option value="Barong">Barong</option>
                  <option value="Gown">Gown</option>
                  <option value="Suit">Suit</option>
                  <option value="Slacks">Slacks</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 4500"
                  min="1"
                  value={newRental.price}
                  onChange={(e) => setNewRental({ ...newRental, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newRental.status}
                  onChange={(e) => setNewRental({ ...newRental, status: e.target.value })}
                >
                  <option value="Rented">Rented</option>
                  <option value="Returned">Returned</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAddRental}>Add Rental</button>
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
              <div className="detail-row">
                <strong>Item Photo:</strong>
                <img src="https://via.placeholder.com/120" alt="Item" className="item-image" />
              </div>
              <div className="detail-row">
                <strong>Unique No:</strong>
                <span>{selectedRental.uniqueNo}</span>
              </div>
              <div className="detail-row">
                <strong>Customer:</strong>
                <span>{selectedRental.name}</span>
              </div>
              <div className="detail-row">
                <strong>Rented Item:</strong>
                <span>{selectedRental.rentedItem}</span>
              </div>
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{selectedRental.category}</span>
              </div>
              <div className="detail-row">
                <strong>Rental Date:</strong>
                <span>{selectedRental.date}</span>
              </div>
              <div className="detail-row">
                <strong>Price:</strong>
                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  ₱{selectedRental.price.toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${getStatusClass(selectedRental.status)}`}>
                  {selectedRental.status}
                </span>
              </div>
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