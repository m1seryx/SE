import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import '../styles/Profile.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import { getUserOrderTracking, getStatusBadgeClass, getStatusLabel } from '../api/OrderTrackingApi';

const Profile = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const user = {
    name: (typeof window !== 'undefined' && localStorage.getItem('userName')) || 'Guest',
    email: (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'guest@example.com',
  };

  // Fetch order tracking data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getUserOrderTracking();
        console.log("Orders fetched:", result); // Debug log
        if (result.success) {
          // Additional filter to ensure no rejected orders appear
          const filteredOrders = result.data.map(order => ({
            ...order,
            items: order.items.filter(item =>
              item.status !== 'cancelled' &&
              item.status !== 'rejected' &&
              item.status !== 'price_declined'
            )
          })).filter(order => order.items.length > 0);

          setOrders(filteredOrders);
          console.log("Filtered orders data:", filteredOrders); // Debug log
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

  // Check for price confirmation orders and show notification
  useEffect(() => {
    if (orders.length > 0) {
      const priceConfirmationOrders = orders.filter(order =>
        order.items && order.items.some(item => item.status === 'price_confirmation')
      );

      if (priceConfirmationOrders.length > 0) {
        // Show notification for price confirmation
        const notificationMessage = `You have ${priceConfirmationOrders.length} order(s) awaiting price confirmation!`;
        alert(notificationMessage); // Simple notification - you can replace with a better notification system
      }
    }
  }, [orders]);

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

  // Handle view details
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  };

  // Handle accept price
  const handleAcceptPrice = async (item) => {
    try {
      // Call API to accept price and update status to confirmed
      const response = await fetch(`http://localhost:5000/api/orders/${item.order_item_id}/accept-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('Price accepted! Your order is now in progress.');
        // Refresh orders to show updated status
        const ordersResult = await getUserOrderTracking();
        if (ordersResult.success) {
          setOrders(ordersResult.data);
        }
      } else {
        alert(result.message || 'Failed to accept price');
        console.error('Failed to accept price:', result);
      }
    } catch (error) {
      alert('Error accepting price. Please try again.');
      console.error('Error accepting price:', error);
    }
  };

  // Handle decline price
  const handleDeclinePrice = async (item) => {
    try {
      // Call API to decline price and update status to declined
      const response = await fetch(`http://localhost:5000/api/orders/${item.order_item_id}/decline-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('Price declined. Your order has been cancelled.');
        // Refresh orders to show updated status
        const ordersResult = await getUserOrderTracking();
        if (ordersResult.success) {
          setOrders(ordersResult.data);
        }
      } else {
        alert(result.message || 'Failed to decline price');
        console.error('Failed to decline price:', result);
      }
    } catch (error) {
      alert('Error declining price. Please try again.');
      console.error('Error declining price:', error);
    }
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

  // Helper function to get timeline dot status
  const getStatusDotClass = (currentStatus, stepStatus, serviceType = null) => {
    // Define status flows for different service types
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned', 'completed'];
    const defaultFlow = ['pending', 'price_confirmation', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    if (currentIndex >= stepIndex) {
      return 'completed';
    } else {
      return 'pending';
    }
  };

  // Helper function to get timeline date
  const getTimelineDate = (updatedAt, currentStatus, stepStatus, serviceType = null) => {
    // Define status flows for different service types
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned', 'completed'];
    const defaultFlow = ['pending', 'price_confirmation', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    if (currentIndex >= stepIndex) {
      if (stepIndex === 0) {
        return formatDate(updatedAt); // Order placed date
      } else if (currentIndex === stepIndex) {
        return formatDate(updatedAt); // Current step date
      } else {
        return formatDate(updatedAt); // Completed step date
      }
    } else {
      return 'Pending';
    }
  };

  // Helper function to check if timeline item should be marked as completed
  const getTimelineItemClass = (currentStatus, stepStatus, serviceType = null) => {
    // Define status flows for different service types
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned', 'completed'];
    const defaultFlow = ['pending', 'price_confirmation', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    return currentIndex >= stepIndex ? 'completed' : '';
  };

  // Helper function to get estimated price from specific_data
  const getEstimatedPrice = (specificData, serviceType) => {
    if (serviceType === 'repair') {
      // First check if estimated price is explicitly provided
      if (specificData?.estimatedPrice) {
        return specificData.estimatedPrice;
      }
      // Otherwise calculate from damage level
      const damageLevel = specificData?.damageLevel;
      const prices = {
        'minor': 300,
        'moderate': 500,
        'major': 800,
        'severe': 1200
      };
      return prices[damageLevel] || 0;
    } else if (serviceType === 'dry_cleaning') {
      // Calculate estimated price for dry cleaning
      // Formula: base_price + (price_per_item * quantity)
      const serviceName = specificData?.serviceName || '';
      const quantity = specificData?.quantity || 1;

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

      return basePrice + (perItemPrice * quantity);
    }
    return 0;
  };

  // Helper function to check if price changed
  const hasPriceChanged = (specificData, finalPrice, serviceType) => {
    const estimatedPrice = getEstimatedPrice(specificData, serviceType);

    // If there's an estimated price and it differs from final price, it was updated by admin
    if (estimatedPrice > 0) {
      return Math.abs(finalPrice - estimatedPrice) > 0.01; // Allow for small floating point differences
    }

    // If no estimated price, admin set the final price (this is normal, not a "change")
    return false;
  };

  // Filter orders based on status
  const getFilteredOrders = () => {
    if (statusFilter === 'all') {
      return orders;
    }
    return orders.filter(order =>
      order.items.some(item => item.status === statusFilter)
    );
  };

  // Get all order items from filtered orders
  const getAllOrderItems = () => {
    const allItems = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        // Apply Status Filter
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        // Apply Service Filter
        const matchesService = serviceFilter === 'all' || item.service_type === serviceFilter;

        if (matchesStatus && matchesService) {
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
        }
      });
    });

    return allItems;
  };

  // Get status counts for filter badges
  const getStatusCounts = () => {
    const counts = {
      all: 0,
      pending: 0,
      price_confirmation: 0,
      in_progress: 0,
      ready_to_pickup: 0,
      completed: 0,
      cancelled: 0,
      price_declined: 0
    };

    orders.forEach(order => {
      order.items.forEach(item => {
        if (counts[item.status] !== undefined) {
          counts[item.status]++;
        }
        counts.all++; // Count all items
      });
    });

    return counts;
  };

  // Get service counts for filter badges
  const getServiceCounts = () => {
    const counts = {
      all: 0,
      repair: 0,
      customize: 0,
      dry_cleaning: 0,
      rental: 0
    };

    orders.forEach(order => {
      order.items.forEach(item => {
        // Only count if it matches the current status filter (optional, but good for UX)
        // For now, let's count global totals to be consistent with status counts
        if (counts[item.service_type] !== undefined) {
          counts[item.service_type]++;
        }
        // Handle variations of dry cleaning if necessary, but backend should normalize
        if (item.service_type === 'drycleaning' || item.service_type === 'dry-cleaning') {
          counts['dry_cleaning']++;
        }

        counts.all++;
      });
    });

    return counts;
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

        <h2 className="section-title">Order Tracking</h2>

        {/* Service Filters */}
        <div className="status-filters service-filters" style={{ marginBottom: '15px' }}>
          <span className="filter-label" style={{ marginRight: '10px', fontWeight: 'bold' }}>Service:</span>
          <button
            className={`filter-btn ${serviceFilter === 'all' ? 'active' : ''}`}
            onClick={() => setServiceFilter('all')}
          >
            All ({getServiceCounts().all})
          </button>
          <button
            className={`filter-btn ${serviceFilter === 'repair' ? 'active' : ''}`}
            onClick={() => setServiceFilter('repair')}
          >
            Repair ({getServiceCounts().repair})
          </button>
          <button
            className={`filter-btn ${serviceFilter === 'customize' ? 'active' : ''}`}
            onClick={() => setServiceFilter('customize')}
          >
            Customize ({getServiceCounts().customize})
          </button>
          <button
            className={`filter-btn ${serviceFilter === 'dry_cleaning' ? 'active' : ''}`}
            onClick={() => setServiceFilter('dry_cleaning')}
          >
            Dry Cleaning ({getServiceCounts().dry_cleaning})
          </button>
          <button
            className={`filter-btn ${serviceFilter === 'rental' ? 'active' : ''}`}
            onClick={() => setServiceFilter('rental')}
          >
            Rental ({getServiceCounts().rental})
          </button>
        </div>

        {/* Status Filters */}
        <div className="status-filters">
          <span className="filter-label" style={{ marginRight: '10px', fontWeight: 'bold' }}>Status:</span>
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({getStatusCounts().all})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({getStatusCounts().pending})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'price_confirmation' ? 'active' : ''}`}
            onClick={() => setStatusFilter('price_confirmation')}
          >
            Price Confirmation ({getStatusCounts().price_confirmation})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress ({getStatusCounts().in_progress})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'ready_to_pickup' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ready_to_pickup')}
          >
            Ready to Pickup ({getStatusCounts().ready_to_pickup})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({getStatusCounts().completed})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled ({getStatusCounts().cancelled})
          </button>
        </div>

        <div className="order-section">
          {loading ? (
            <div className="loading-message">Loading orders...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : getAllOrderItems().length === 0 ? (
            <div className="no-orders">No orders found</div>
          ) : (
            <div className="order-cards">
              {getAllOrderItems().map((item) => {
                const estimatedPrice = getEstimatedPrice(item.specific_data, item.service_type);
                const priceChanged = hasPriceChanged(item.specific_data, item.final_price, item.service_type);

                return (
                  <div key={`${item.order_id}-${item.order_item_id}-${item.service_type}-${item.status_updated_at || Date.now()}`} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3 className="order-id">ORD-{item.order_id}</h3>
                        <span className="service-type">
                          {item.service_type.charAt(0).toUpperCase() + item.service_type.slice(1)}
                          {item.specific_data?.serviceName && (
                            <span className="service-name">
                              {" - " + item.specific_data.serviceName}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="order-price">₱{parseFloat(item.final_price).toFixed(2)}</div>
                    </div>

                    <div className="order-status">
                      <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Price Comparison */}
                    {(estimatedPrice > 0 || item.final_price > 0) && (
                      <div className="price-comparison">
                        {estimatedPrice > 0 ? (
                          <>
                            <div className="price-row">
                              <span className="price-label">Estimated Price:</span>
                              <span className="price-value estimated">₱{estimatedPrice.toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                              <span className="price-label">Final Price:</span>
                              <span className={`price-value ${priceChanged ? 'changed' : 'same'}`}>
                                ₱{parseFloat(item.final_price).toFixed(2)}
                                {priceChanged && <span className="price-change-indicator">⚠️ Updated by Admin</span>}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="price-row">
                            <span className="price-label">Final Price:</span>
                            <span className="price-value final">₱{parseFloat(item.final_price).toFixed(2)}</span>
                          </div>
                        )}
                        {priceChanged && item.specific_data?.adminNotes && (
                          <div className="admin-notes">
                            <span className="notes-label">Admin Note:</span>
                            <span className="notes-text">{item.specific_data.adminNotes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deposit Amount for Rental (Ready to Pick Up) */}
                    {item.service_type === 'rental' && (item.status === 'ready_to_pickup' || item.status === 'ready_for_pickup') && (
                      <div className="deposit-info" style={{
                        background: '#fff3e0',
                        border: '2px solid #ff9800',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '20px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '24px' }}>💰</span>
                          <strong style={{ color: '#e65100', fontSize: '16px' }}>Deposit Payment Required</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                          Please pay the deposit amount when picking up your rental item from the store.
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>
                          Deposit Amount: ₱{parseFloat(item.pricing_factors?.deposit_amount || item.specific_data?.deposit_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div className="order-timeline">
                      <div className="timeline-container">
                        {/* Conditional timeline based on service type */}
                        {item.service_type === 'rental' ? (
                          <>
                            {/* Rental Timeline: Order Placed → Ready to Pick Up → Rented → Returned → Completed */}
                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'pending', 'rental')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'pending', 'rental')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Order Placed</div>
                                <div className="timeline-date">{formatDate(item.order_date)}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'ready_to_pickup', 'rental')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'ready_to_pickup', 'rental')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Ready to Pick Up</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'ready_to_pickup', 'rental')}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'rented', 'rental')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'rented', 'rental')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Rented</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'rented', 'rental')}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'returned', 'rental')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'returned', 'rental')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Returned</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'returned', 'rental')}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'completed', 'rental')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'completed', 'rental')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Completed</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'completed', 'rental')}</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Default Timeline for Repair/Dry Cleaning/Customize: Order Placed → Price Confirmation → In Progress → Ready to Pick Up → Completed */}
                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'pending')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'pending')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Order Placed</div>
                                <div className="timeline-date">{formatDate(item.order_date)}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'price_confirmation')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'price_confirmation')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Price Confirmation</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'price_confirmation')}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'in_progress')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'in_progress')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">In Progress</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'in_progress')}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'ready_to_pickup')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'ready_to_pickup')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Ready to Pick Up</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'ready_to_pickup')}</div>
                              </div>
                            </div>

                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'completed')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'completed')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Completed</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'completed')}</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price Confirmation Actions */}
                    {item.status === 'price_confirmation' && (
                      <div className="price-confirmation-actions">
                        <div className="confirmation-message">
                          <strong>Price Update Required</strong>
                          <p>Please review the updated pricing and confirm to proceed.</p>
                        </div>
                        <div className="action-buttons">
                          <button className="btn-accept-price" onClick={() => handleAcceptPrice(item)}>
                            Accept Price - Continue
                          </button>
                          <button className="btn-decline-price" onClick={() => handleDeclinePrice(item)}>
                            Decline Price
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="order-footer">
                      <div className="order-dates">
                        <span className="date-info">Requested: {formatDate(item.order_date)}</span>
                        <span className="date-info">Updated: {formatDate(item.status_updated_at)}</span>
                      </div>
                      <button
                        className="btn-view-details"
                        onClick={() => handleViewDetails(item)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
          }
        </div >
      </main >

      {/* Order Details Modal */}
      {
        detailsModalOpen && selectedItem && (
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
        )
      }
    </div >
  );
};

export default Profile;
