import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import '../styles/Profile.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import { getUserOrderTracking } from '../api/OrderTrackingApi';

const Profile = () => {
  const navigate = useNavigate();
<<<<<<< HEAD
=======
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
>>>>>>> bee3d85cfeb54b9ff1dbe00c18c1732d3e26d9e9

  const user = {
    name: (typeof window !== 'undefined' && localStorage.getItem('userName')) || 'Guest',
    email: (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'guest@example.com',
  };

  // Fetch order tracking data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getUserOrderTracking();
        if (result.success) {
          setOrders(result.data);
        } else {
          setError(result.message || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Error loading orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'pending': 'pending',
      'in_progress': 'in-progress',
      'ready_to_pickup': 'ready',
      'picked_up': 'picked-up',
      'rented': 'rented',
      'returned': 'returned',
      'completed': 'completed'
    };
    return statusMap[status] || 'unknown';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'ready_to_pickup': 'Ready to Pickup',
      'picked_up': 'Picked Up',
      'rented': 'Rented',
      'returned': 'Returned',
      'completed': 'Completed'
    };
    return statusMap[status] || status;
  };

  // Flatten orders and items for table display
  const getAllOrderItems = () => {
    const allItems = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        allItems.push({
          order_id: order.order_id,
          order_item_id: item.order_item_id,
          service_type: item.service_type,
          status: item.status,
          status_label: item.status_label,
          status_class: item.status_class,
          final_price: item.final_price,
          order_date: order.order_date,
          status_updated_at: item.status_updated_at,
          specific_data: item.specific_data
        });
      });
    });
    return allItems;
  };

  // Handle view details
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setSelectedItem(null);
    setDetailsModalOpen(false);
  };

  // Render service-specific details
  const renderServiceDetails = (item) => {
    const { service_type, specific_data } = item;
    
    console.log('Rendering service details for:', { service_type, specific_data });
    console.log('Service type type:', typeof service_type);
    console.log('Service type value:', `"${service_type}"`);
    
    switch (service_type) {
      case 'rental':
        console.log('Matched rental case');
        return (
          <div className="service-details rental-details">
            <h4>Rental Details</h4>
            
            {/* Show rental image if available */}
            {specific_data.image_url && specific_data.image_url !== 'no-image' && (
              <div className="detail-row">
                <span className="detail-label">Item Photo:</span>
                <div className="detail-value">
                  <img 
                    src={specific_data.image_url} 
                    alt="Rental item" 
                    className="damage-photo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.log('Rental image failed to load:', specific_data.image_url);
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="detail-row">
              <span className="detail-label">Item Name:</span>
              <span className="detail-value">{specific_data.item_name || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{specific_data.category || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Brand:</span>
              <span className="detail-value">{specific_data.brand || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Size:</span>
              <span className="detail-value">{specific_data.size || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Rental Period:</span>
              <span className="detail-value">
                {specific_data.rental_start_date ? new Date(specific_data.rental_start_date).toLocaleDateString() : 'N/A'} to {' '}
                {specific_data.rental_end_date ? new Date(specific_data.rental_end_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {specific_data.notes && (
              <div className="detail-row">
                <span className="detail-label">Notes:</span>
                <span className="detail-value">{specific_data.notes}</span>
              </div>
            )}
          </div>
        );
        
      case 'repair':
        // Calculate estimated price based on damage level
        const getEstimatedPrice = (damageLevel) => {
          const prices = {
            'minor': 300,
            'moderate': 500,
            'major': 800,
            'severe': 1200
          };
          return prices[damageLevel] || 'N/A';
        };
        
        // Calculate estimated time based on damage level
        const getEstimatedTimeFromLevel = (damageLevel) => {
          const times = {
            'minor': '2-3 days',
            'moderate': '3-5 days',
            'major': '5-7 days',
            'severe': '1-2 weeks'
          };
          return times[damageLevel] || 'N/A';
        };
        
        const damageLevel = specific_data.damageLevel || 'N/A';
        const estimatedPrice = specific_data.estimatedPrice || getEstimatedPrice(damageLevel);
        const estimatedTime = specific_data.estimatedTime || getEstimatedTimeFromLevel(damageLevel);
        
        return (
          <div className="service-details repair-details">
            <h4>Repair Details</h4>
            {specific_data.imageUrl && specific_data.imageUrl !== 'no-image' && (
              <div className="detail-row">
                <span className="detail-label">Damage Photo:</span>
                <div className="detail-value">
                  <img 
                    src={`http://localhost:5000${specific_data.imageUrl}`} 
                    alt="Damage" 
                    className="damage-photo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.log('Image failed to load:', specific_data.imageUrl);
                    }}
                  />
                </div>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Service Name:</span>
              <span className="detail-value">{specific_data.serviceName || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Damage Level:</span>
              <span className="detail-value">{damageLevel}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Garment Type:</span>
              <span className="detail-value">{specific_data.damageLocation || specific_data.garmentType || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{specific_data.damageDescription || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Pickup Date:</span>
              <span className="detail-value">{specific_data.pickupDate || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estimated Price:</span>
              <span className="detail-value">₱{estimatedPrice}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estimated Time:</span>
              <span className="detail-value">{estimatedTime}</span>
            </div>
          </div>
        );
        
      case 'customize':
        return (
          <div className="service-details customize-details">
            <h4>Customization Details</h4>
            <div className="detail-row">
              <span className="detail-label">Service Name:</span>
              <span className="detail-value">{specific_data.serviceName || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Garment Type:</span>
              <span className="detail-value">{specific_data.garmentType || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Size:</span>
              <span className="detail-value">{specific_data.size || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{specific_data.description || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Appointment Date:</span>
              <span className="detail-value">{specific_data.appointmentDate || 'N/A'}</span>
            </div>
          </div>
        );
        
      case 'dry_cleaning':
      case 'drycleaning':
      case 'dry-cleaning':
      case 'dry cleaning':
        console.log('Matched dry cleaning case');
        // Calculate estimated price and time for dry cleaning
        console.log('Processing dry cleaning service');
        const getDryCleaningEstimatedPrice = (serviceName, quantity) => {
          // Base prices for different service types
          const basePrices = {
            'Basic Dry Cleaning': 200,
            'Premium Dry Cleaning': 350,
            'Delicate Items': 450,
            'Express Service': 500
          };
          const pricePerItem = {
            'Basic Dry Cleaning': 150,
            'Premium Dry Cleaning': 250,
            'Delicate Items': 350,
            'Express Service': 400
          };
          
          const basePrice = basePrices[serviceName] || 200;
          const perItemPrice = pricePerItem[serviceName] || 150;
          const qty = parseInt(quantity) || 1;
          
          return basePrice + (perItemPrice * qty);
        };
        
        const getDryCleaningEstimatedTime = (serviceName) => {
          const times = {
            'Basic Dry Cleaning': '2-3 days',
            'Premium Dry Cleaning': '3-4 days',
            'Delicate Items': '4-5 days',
            'Express Service': '1-2 days'
          };
          return times[serviceName] || '2-3 days';
        };
        
        const cleaningServiceName = specific_data.serviceName || 'N/A';
        const cleaningQuantity = specific_data.quantity || 1;
        const dryCleaningEstimatedPrice = specific_data.finalPrice || getDryCleaningEstimatedPrice(cleaningServiceName, cleaningQuantity);
        const dryCleaningEstimatedTime = specific_data.estimatedTime || getDryCleaningEstimatedTime(cleaningServiceName);
        
        return (
          <div className="service-details drycleaning-details">
            <h4>Dry Cleaning Details</h4>
            
            {/* Show clothing image if available */}
            {specific_data.imageUrl && specific_data.imageUrl !== 'no-image' && (
              <div className="detail-row">
                <span className="detail-label">Clothing Photo:</span>
                <div className="detail-value">
                  <img 
                    src={`http://localhost:5000${specific_data.imageUrl}`} 
                    alt="Clothing" 
                    className="damage-photo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="detail-row">
              <span className="detail-label">Service Name:</span>
              <span className="detail-value">{cleaningServiceName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Brand:</span>
              <span className="detail-value">{specific_data.brand || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Quantity:</span>
              <span className="detail-value">{cleaningQuantity} items</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Special Instructions:</span>
              <span className="detail-value">{specific_data.notes || 'None'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Pickup Date:</span>
              <span className="detail-value">{specific_data.pickupDate || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estimated Price:</span>
              <span className="detail-value">₱{dryCleaningEstimatedPrice}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estimated Time:</span>
              <span className="detail-value">{dryCleaningEstimatedTime}</span>
            </div>
          </div>
        );
        
      default:
        console.log('No case matched, falling to default');
        return (
          <div className="service-details">
            <h4>Service Details</h4>
            <div className="detail-row">
              <span className="detail-label">Service Type:</span>
              <span className="detail-value">{service_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Details:</span>
              <span className="detail-value">{JSON.stringify(specific_data, null, 2)}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="profile-page">

      {/* 🔹 Back Button ABOVE the header */}
      <div className="top-btn-wrapper">
        <button
          className="btn-secondary"
          onClick={() => navigate('/user-home')}
        >
          Back to Home
        </button>
      </div>

      {/* 🔹 Header */}
      <header className="header">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-img" />
          <span className="logo-text">D’jackman Tailor Deluxe</span>
        </div>

        <div className="user-info">
          <img src={dp} alt="User" className="profile-img" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="profile-main">
        <h2 className="section-title">User Information</h2>

        <div className="user-info-card">
          <div className="user-card-row">
            <img src={dp} alt="User" className="user-avatar" />
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <h2 className="section-title">Order Tracking (Sample)</h2>

        <div className="order-section">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Service</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Last Update</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>ORD-1001</td>
                <td>Repair</td>
                <td><span className="status-badge in-progress">In Progress</span></td>
                <td>2025-11-10</td>
                <td>2025-11-12</td>
              </tr>

              <tr>
                <td>ORD-1002</td>
                <td>Customize</td>
                <td><span className="status-badge design">Design</span></td>
                <td>2025-11-08</td>
                <td>2025-11-11</td>
              </tr>

              <tr>
                <td>ORD-1003</td>
                <td>Dry Cleaning</td>
                <td><span className="status-badge cleaning">Cleaning</span></td>
                <td>2025-11-09</td>
                <td>2025-11-10</td>
              </tr>

              <tr>
                <td>ORD-1004</td>
                <td>Rental</td>
                <td><span className="status-badge active">Active</span></td>
                <td>2025-11-07</td>
                <td>2025-11-13</td>
              </tr>
            </tbody>
          </table>
=======
        <h2 className="section-title">Order Tracking</h2>

        <div className="order-section">
          {loading ? (
            <div className="loading-message">Loading orders...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : getAllOrderItems().length === 0 ? (
            <div className="no-orders">No orders found</div>
          ) : (
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Requested</th>
                  <th>Last Update</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {getAllOrderItems().map((item) => (
                  <tr key={item.order_item_id}>
                    <td>ORD-{item.order_id}</td>
                    <td>
                      <span className="service-type">
                        {item.service_type.charAt(0).toUpperCase() + item.service_type.slice(1)}
                        {item.specific_data?.serviceName && (
                          <span className="service-name">
                            {" - " + item.specific_data.serviceName}
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>₱{parseFloat(item.final_price).toFixed(2)}</td>
                    <td>{formatDate(item.order_date)}</td>
                    <td>{formatDate(item.status_updated_at)}</td>
                    <td>
                      <button 
                        className="btn-view-details"
                        onClick={() => handleViewDetails(item)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
>>>>>>> bee3d85cfeb54b9ff1dbe00c18c1732d3e26d9e9
        </div>
      </main>

      {/* Order Details Modal */}
      {detailsModalOpen && selectedItem && (
        <div className="details-modal-overlay" onClick={closeDetailsModal}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h3>Order Details - ORD-{selectedItem.order_id}</h3>
              <button className="details-modal-close" onClick={closeDetailsModal}>×</button>
            </div>
            
            <div className="details-modal-content">
              <div className="order-summary">
                <div className="summary-item">
                  <span className="summary-label">Service Type:</span>
                  <span className="summary-value">
                    {selectedItem.service_type.charAt(0).toUpperCase() + selectedItem.service_type.slice(1)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Status:</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedItem.status)}`}>
                    {getStatusLabel(selectedItem.status)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Price:</span>
                  <span className="summary-value">₱{parseFloat(selectedItem.final_price).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Order Date:</span>
                  <span className="summary-value">{formatDate(selectedItem.order_date)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Last Updated:</span>
                  <span className="summary-value">{formatDate(selectedItem.status_updated_at)}</span>
                </div>
              </div>

              {renderServiceDetails(selectedItem)}
            </div>
            
            <div className="details-modal-footer">
              <button className="btn-secondary" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
