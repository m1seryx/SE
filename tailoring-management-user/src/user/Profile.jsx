import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import '../styles/Profile.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import { getUser } from '../api/AuthApi';
import { getUserOrderTracking, getStatusBadgeClass, getStatusLabel, cancelOrderItem } from '../api/OrderTrackingApi';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { useAlert } from '../context/AlertContext';
import { getMyMeasurements } from '../api/CustomerApi';

const Profile = () => {
  const { alert } = useAlert();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  
  // Image preview modal state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageAlt, setPreviewImageAlt] = useState('');
  
  // Measurements modal state
  const [measurementsModalOpen, setMeasurementsModalOpen] = useState(false);
  const [measurements, setMeasurements] = useState(null);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  
  // Cancel order modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Function to open image preview
  const openImagePreview = (imageUrl, altText) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageAlt(altText || 'Order Image');
    setImagePreviewOpen(true);
  };

  const user = getUser() || {
    name: 'Guest',
    email: 'guest@example.com',
  };
  console.log('Profile user from getUser():', user);

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
    const checkPriceConfirmation = async () => {
      if (orders.length > 0) {
        const priceConfirmationOrders = orders.filter(order =>
          order.items && order.items.some(item => item.status === 'price_confirmation')
        );

        if (priceConfirmationOrders.length > 0) {
          // Show notification for price confirmation
          const notificationMessage = `You have ${priceConfirmationOrders.length} order(s) awaiting price confirmation!`;
          await alert(notificationMessage, 'Price Confirmation Required', 'info');
        }
      }
    };
    
    checkPriceConfirmation();
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

  // Format date and time in 12-hour format
  const formatDateTo12Hour = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      return `${dateStr} at ${timeStr}`;
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper function to format size measurements
  const formatSize = (size) => {
    if (!size) return 'N/A';
    
    // If it's already a string and not JSON, return as is
    if (typeof size === 'string' && !size.trim().startsWith('{')) {
      return size;
    }
    
    try {
      // Parse JSON if it's a string
      let measurements = typeof size === 'string' ? JSON.parse(size) : size;
      
      // If it's not an object, return as is
      if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) {
        return typeof size === 'string' ? size : JSON.stringify(size);
      }
      
      // Format measurements nicely
      const labelMap = {
        'chest': 'Chest',
        'shoulders': 'Shoulders',
        'sleeveLength': 'Sleeve Length',
        'neck': 'Neck',
        'waist': 'Waist',
        'length': 'Length'
      };
      
      const parts = Object.entries(measurements)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '' && value !== '0')
        .map(([key, value]) => {
          const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
          return `${label}: ${value}"`;
        });
      
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    } catch (e) {
      // If parsing fails, return as is
      return typeof size === 'string' ? size : 'N/A';
    }
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
      'price_confirmation': 'Price Confirmation',
      'accepted': 'Accepted',
      'in_progress': 'In Progress',
      'ready_to_pickup': 'Ready to Pickup',
      'picked_up': 'Picked Up',
      'rented': 'Rented',
      'returned': 'Returned',
      'completed': 'Completed'
    };
    return statusMap[status] || status;
  };

  // Format service type (replace underscores with spaces and capitalize)
  const formatServiceType = (serviceType) => {
    if (!serviceType) return '';
    return serviceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format service name (remove leading dashes and capitalize)
  const formatServiceName = (serviceName) => {
    if (!serviceName) return '';
    // Remove leading dashes, hyphens, and spaces
    let formatted = serviceName.replace(/^[\s\-–—]+/, '');
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Helper functions for customization details
  const getColorName = (hex) => {
    if (!hex) return 'Not specified';
    
    // Handle if it's already a string name
    if (typeof hex === 'string' && !hex.startsWith('#') && !hex.match(/^[0-9a-fA-F]{3,6}$/)) {
      return hex.charAt(0).toUpperCase() + hex.slice(1);
    }
    
    // Normalize hex
    let normalizedHex = String(hex).toLowerCase().trim();
    if (!normalizedHex.startsWith('#')) {
      normalizedHex = `#${normalizedHex}`;
    }
    
    // Color mappings
    const colorMap = {
      '#1a1a1a': 'Classic Black',
      '#1e3a5f': 'Navy Blue',
      '#6b1e3d': 'Burgundy',
      '#2d5a3d': 'Forest Green',
      '#4a4a4a': 'Charcoal Gray',
      '#c9a66b': 'Camel Tan',
      '#f5e6d3': 'Cream White',
      '#5d4037': 'Chocolate Brown',
      '#2a4d8f': 'Royal Blue',
      '#722f37': 'Wine Red',
      '#ffffff': 'White',
      '#000000': 'Black',
      '#ff0000': 'Red',
      '#00ff00': 'Green',
      '#0000ff': 'Blue',
      '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta',
      '#00ffff': 'Cyan',
      '#808080': 'Gray',
      '#800000': 'Maroon',
      '#008000': 'Dark Green',
      '#000080': 'Navy',
      '#800080': 'Purple',
      '#ffa500': 'Orange',
      '#a52a2a': 'Brown',
      '#ffc0cb': 'Pink',
      '#ffd700': 'Gold',
      '#c0c0c0': 'Silver',
    };
    
    if (colorMap[normalizedHex]) {
      return colorMap[normalizedHex];
    }
    
    // Try to derive a name from RGB
    try {
      const r = parseInt(normalizedHex.slice(1, 3), 16);
      const g = parseInt(normalizedHex.slice(3, 5), 16);
      const b = parseInt(normalizedHex.slice(5, 7), 16);
      
      if (r > 200 && g > 200 && b > 200) return 'Light';
      if (r < 50 && g < 50 && b < 50) return 'Dark';
      if (r > g && r > b) return 'Reddish';
      if (g > r && g > b) return 'Greenish';
      if (b > r && b > g) return 'Bluish';
      if (r === g && g === b) return 'Gray';
    } catch (e) {
      // Fall through to return hex
    }
    
    return normalizedHex;
  };

  const getButtonType = (modelPath) => {
    if (!modelPath) return '';
    const buttonMap = {
      '/orange button 3d model.glb': 'Orange Button',
      '/four hole button 3d model (1).glb': 'Four Hole Button',
    };
    return buttonMap[modelPath] || modelPath.split('/').pop().replace('.glb', '').replace(/\d+/g, '').trim();
  };

  const getAccessoryName = (modelPath) => {
    if (!modelPath) return '';
    const accessoryMap = {
      '/accessories/gold lion pendant 3d model.glb': 'Pendant',
      '/accessories/flower brooch 3d model.glb': 'Brooch',
      '/accessories/fabric rose 3d model.glb': 'Flower',
    };
    return accessoryMap[modelPath] || modelPath.split('/').pop().replace('.glb', '').replace(/\d+/g, '').trim();
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
        await alert('Price accepted! Your order is now accepted.', 'Success', 'success');
        // Refresh orders to show updated status
        const ordersResult = await getUserOrderTracking();
        if (ordersResult.success) {
          setOrders(ordersResult.data);
        }
      } else {
        await alert(result.message || 'Failed to accept price', 'Error', 'error');
        console.error('Failed to accept price:', result);
      }
    } catch (error) {
      await alert('Error accepting price. Please try again.', 'Error', 'error');
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
        await alert('Price declined. Your order has been cancelled.', 'Success', 'success');
        // Refresh orders to show updated status
        const ordersResult = await getUserOrderTracking();
        if (ordersResult.success) {
          setOrders(ordersResult.data);
        }
      } else {
        await alert(result.message || 'Failed to decline price', 'Error', 'error');
        console.error('Failed to decline price:', result);
      }
    } catch (error) {
      await alert('Error declining price. Please try again.', 'Error', 'error');
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
    const { service_type, specific_data, rental_start_date, rental_end_date } = item;

    console.log('Rendering service details for:', { service_type, specific_data, rental_start_date, rental_end_date, item });
    console.log('Service type type:', typeof service_type);
    console.log('Service type value:', `"${service_type}"`);

    switch (service_type) {
      case 'rental':
        console.log('Matched rental case');
        const isBundle = specific_data?.is_bundle === true || specific_data?.category === 'rental_bundle';
        const bundleItems = specific_data?.bundle_items || [];
        
        return (
          <div className="service-details rental-details">
            <h4>Rental Details</h4>

            {/* Show bundle items with images if it's a bundle */}
            {isBundle && bundleItems.length > 0 ? (
              <div className="detail-row" style={{ marginBottom: '20px' }}>
                <span className="detail-label">Rental Items:</span>
                <div className="detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {bundleItems.map((bundleItem, idx) => (
                    <div key={idx} style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '15px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      {/* Show image if available */}
                      {bundleItem.image_url && bundleItem.image_url !== 'no-image' && (
                        <div style={{ marginBottom: '10px' }}>
                          <img
                            src={bundleItem.image_url}
                            alt={bundleItem.item_name || 'Rental item'}
                            className="damage-photo clickable-image"
                            onClick={() => openImagePreview(bundleItem.image_url, bundleItem.item_name || 'Rental Item')}
                            title="Click to enlarge"
                            style={{ maxWidth: '200px', maxHeight: '200px', cursor: 'pointer', borderRadius: '6px' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div><strong>Item {idx + 1}:</strong> {bundleItem.item_name || 'N/A'}</div>
                      <div><strong>Brand:</strong> {bundleItem.brand || 'N/A'}</div>
                      <div><strong>Size:</strong> {formatSize(bundleItem.size)}</div>
                      <div><strong>Category:</strong> {bundleItem.category || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Show single rental image if available */
              specific_data.image_url && specific_data.image_url !== 'no-image' && (
                <div className="detail-row">
                  <span className="detail-label">Item Photo:</span>
                  <div className="detail-value">
                    <img
                      src={specific_data.image_url}
                      alt="Rental item"
                      className="damage-photo clickable-image"
                      onClick={() => openImagePreview(specific_data.image_url, specific_data.item_name || 'Rental Item')}
                      title="Click to enlarge"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        console.log('Rental image failed to load:', specific_data.image_url);
                      }}
                    />
                  </div>
                </div>
              )
            )}

            <div className="detail-row">
              <span className="detail-label">Item Name:</span>
              <span className="detail-value">
                {isBundle && bundleItems.length > 0 
                  ? bundleItems.map(item => item.item_name).join(', ')
                  : (specific_data.item_name || 'N/A')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">
                {isBundle && bundleItems.length > 0
                  ? bundleItems.map(item => item.category || 'rental').join(', ')
                  : (specific_data.category || 'N/A')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Brand:</span>
              <span className="detail-value">
                {isBundle && bundleItems.length > 0
                  ? bundleItems.map(item => item.brand || 'N/A').join(', ')
                  : (specific_data.brand || 'N/A')}
              </span>
            </div>
            <div className="detail-row" style={{ alignItems: 'flex-start' }}>
              <span className="detail-label" style={{ minWidth: '120px' }}>Size:</span>
              <span className="detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, textAlign: 'left' }}>
                {isBundle && bundleItems.length > 0
                  ? bundleItems.map((item, idx) => (
                      <div key={idx} style={{ 
                        fontSize: '0.9rem', 
                        lineHeight: '1.5',
                        padding: '8px 12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <strong style={{ color: '#333', marginRight: '8px' }}>Item {idx + 1}:</strong>
                        <span style={{ color: '#666' }}>{formatSize(item.size)}</span>
                      </div>
                    ))
                  : (
                      <div style={{ 
                        fontSize: '0.9rem', 
                        lineHeight: '1.5',
                        padding: '8px 12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0',
                        color: '#666'
                      }}>
                        {formatSize(specific_data.size)}
                      </div>
                    )}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Rental Period:</span>
              <span className="detail-value">
                {(() => {
                  // Try to get dates from order item (rental_start_date/rental_end_date) or specific_data
                  // Also check item directly in case it's nested
                  const startDate = rental_start_date || item?.rental_start_date || specific_data?.rental_start_date || specific_data?.rentalDates?.startDate;
                  const endDate = rental_end_date || item?.rental_end_date || specific_data?.rental_end_date || specific_data?.rentalDates?.endDate;
                  
                  console.log('Rental dates check:', { rental_start_date, rental_end_date, item_rental_start: item?.rental_start_date, item_rental_end: item?.rental_end_date, startDate, endDate });
                  
                  if (startDate && endDate) {
                    try {
                      return `${formatDate(startDate)} to ${formatDate(endDate)}`;
                    } catch (e) {
                      return `${startDate} to ${endDate}`;
                    }
                  } else if (startDate) {
                    try {
                      return `${formatDate(startDate)} to N/A`;
                    } catch (e) {
                      return `${startDate} to N/A`;
                    }
                  } else if (endDate) {
                    try {
                      return `N/A to ${formatDate(endDate)}`;
                    } catch (e) {
                      return `N/A to ${endDate}`;
                    }
                  }
                  return 'N/A to N/A';
                })()}
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
                    className="damage-photo clickable-image"
                    onClick={() => openImagePreview(`http://localhost:5000${specific_data.imageUrl}`, 'Damage Photo')}
                    title="Click to enlarge"
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
              <span className="detail-value">{formatServiceName(specific_data.serviceName) || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Damage Level:</span>
              <span className="detail-value">{damageLevel ? damageLevel.charAt(0).toUpperCase() + damageLevel.slice(1) : 'N/A'}</span>
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
              <span className="detail-label">Drop Off Item Date:</span>
              <span className="detail-value">{formatDateTo12Hour(specific_data.pickupDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estimated Price:</span>
              <span className="detail-value">₱{estimatedPrice}</span>
            </div>
          </div>
        );

      case 'customize':
      case 'customization':
        return (
          <div className="service-details customize-details">
            <h4>Customization Details</h4>
            
            {/* Show design preview if available */}
            {specific_data.imageUrl && specific_data.imageUrl !== 'no-image' && (
              <div className="detail-row">
                <span className="detail-label">Design Preview:</span>
                <div className="detail-value">
                  <img
                    src={`http://localhost:5000${specific_data.imageUrl}`}
                    alt="Design preview"
                    className="damage-photo clickable-image"
                    onClick={() => openImagePreview(`http://localhost:5000${specific_data.imageUrl}`, 'Design Preview')}
                    title="Click to enlarge"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.log('Design preview image failed to load:', specific_data.imageUrl);
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="detail-row">
              <span className="detail-label">Garment Type:</span>
              <span className="detail-value">{specific_data.garmentType || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fabric Type:</span>
              <span className="detail-value">{specific_data.fabricType || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Preferred Date:</span>
              <span className="detail-value">{specific_data.preferredDate || 'N/A'}</span>
            </div>
            {specific_data.notes && (
              <div className="detail-row">
                <span className="detail-label">Notes:</span>
                <span className="detail-value">{specific_data.notes}</span>
              </div>
            )}
            {specific_data.measurements && (
              <div className="detail-row">
                <span className="detail-label">Measurements:</span>
                <span className="detail-value">{specific_data.measurements}</span>
              </div>
            )}
            
            {/* Display 3D customization choices if available */}
            {specific_data.designData && (
              <div className="detail-row" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <div style={{ width: '100%' }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                    🎨 3D Customization Choices
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
                    {specific_data.designData.size && (
                      <div className="detail-row">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{specific_data.designData.size.charAt(0).toUpperCase() + specific_data.designData.size.slice(1)}</span>
                      </div>
                    )}
                    {specific_data.designData.fit && (
                      <div className="detail-row">
                        <span className="detail-label">Fit:</span>
                        <span className="detail-value">{specific_data.designData.fit.charAt(0).toUpperCase() + specific_data.designData.fit.slice(1)}</span>
                      </div>
                    )}
                    {specific_data.designData.colors && specific_data.designData.colors.fabric && (
                      <div className="detail-row">
                        <span className="detail-label">Color:</span>
                        <span className="detail-value">{getColorName(specific_data.designData.colors.fabric)}</span>
                      </div>
                    )}
                    {specific_data.designData.pattern && specific_data.designData.pattern !== 'none' && (
                      <div className="detail-row">
                        <span className="detail-label">Pattern:</span>
                        <span className="detail-value">{specific_data.designData.pattern.charAt(0).toUpperCase() + specific_data.designData.pattern.slice(1)}</span>
                      </div>
                    )}
                    {specific_data.designData.personalization && specific_data.designData.personalization.initials && (
                      <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                        <span className="detail-label">Personalization:</span>
                        <span className="detail-value">
                          {specific_data.designData.personalization.initials}
                          {specific_data.designData.personalization.font && ` (${specific_data.designData.personalization.font} font)`}
                        </span>
                      </div>
                    )}
                    {specific_data.designData.buttons && specific_data.designData.buttons.length > 0 && (
                      <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                        <span className="detail-label">Button Types:</span>
                        <div style={{ marginLeft: '10px', marginTop: '5px', fontSize: '13px' }}>
                          {specific_data.designData.buttons.map((btn, index) => (
                            <div key={btn.id || index} style={{ margin: '5px 0' }}>
                              Button {index + 1}: {getButtonType(btn.modelPath)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {specific_data.designData.accessories && specific_data.designData.accessories.length > 0 && (
                      <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                        <span className="detail-label">Accessories:</span>
                        <div style={{ marginLeft: '10px', marginTop: '5px', fontSize: '13px' }}>
                          {specific_data.designData.accessories.map((acc, index) => (
                            <div key={acc.id || index} style={{ margin: '5px 0' }}>
                              {getAccessoryName(acc.modelPath)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                    className="damage-photo clickable-image"
                    onClick={() => openImagePreview(`http://localhost:5000${specific_data.imageUrl}`, 'Clothing Photo')}
                    title="Click to enlarge"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">Service Name:</span>
              <span className="detail-value">{formatServiceName(cleaningServiceName)}</span>
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
              <span className="detail-label">Drop Off Item Date:</span>
              <span className="detail-value">{formatDateTo12Hour(specific_data.pickupDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estimated Price:</span>
              <span className="detail-value">₱{dryCleaningEstimatedPrice}</span>
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
              <span className="detail-value">{formatServiceType(service_type)}</span>
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
    // Rental flow: pending -> ready_to_pickup -> rented -> returned (no completed)
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned'];
    // Updated default flow to handle both workflows - always includes price_confirmation
    const defaultFlow = ['pending', 'price_confirmation', 'accepted', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    // If current status is beyond price_confirmation step, mark price_confirmation as completed
    // This handles cases where admin accepted directly without price confirmation
    if (stepStatus === 'price_confirmation' && currentIndex > 0) {
      // If we're past pending, price_confirmation is implicitly completed
      return 'completed';
    }

    if (currentIndex >= stepIndex) {
      return 'completed';
    } else {
      return 'pending';
    }
  };

  // Helper function to get timeline date
  const getTimelineDate = (updatedAt, currentStatus, stepStatus, serviceType = null) => {
    // Define status flows for different service types
    // Rental flow: pending -> ready_to_pickup -> rented -> returned (no completed)
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned'];
    // Updated default flow to handle both workflows - always includes price_confirmation
    const defaultFlow = ['pending', 'price_confirmation', 'accepted', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    // If price_confirmation was skipped (status went from pending to accepted), show the accepted date
    if (stepStatus === 'price_confirmation' && currentIndex > 1 && currentIndex !== 1) {
      // Price confirmation was implicitly passed, use the date when we moved to accepted or later
      return formatDate(updatedAt);
    }

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
    // Rental flow: pending -> ready_to_pickup -> rented -> returned (no completed)
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned'];
    // Updated default flow to handle both workflows - always includes price_confirmation
    const defaultFlow = ['pending', 'price_confirmation', 'accepted', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    // If price_confirmation step and we're past pending, mark as completed
    // This handles cases where admin accepted directly without price confirmation
    if (stepStatus === 'price_confirmation' && currentIndex > 0) {
      return 'completed';
    }

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
  const hasPriceChanged = (specificData, finalPrice, serviceType, pricingFactors = null) => {
    console.log('=== DEBUG hasPriceChanged ===');
    console.log('specificData:', specificData);
    console.log('finalPrice:', finalPrice);
    console.log('serviceType:', serviceType);
    console.log('pricingFactors:', pricingFactors);
    
    // Check if admin has explicitly marked the price as updated in pricing_factors
    // adminPriceUpdated is stored in pricing_factors, not specific_data
    if (pricingFactors?.adminPriceUpdated === true || specificData?.adminPriceUpdated === true) {
      console.log('Admin price updated flag is TRUE');
      return true;
    }
    
    console.log('adminPriceUpdated flag in pricing_factors:', pricingFactors?.adminPriceUpdated);
    console.log('adminPriceUpdated flag in specific_data:', specificData?.adminPriceUpdated);
    
    // For backward compatibility, check if there's a significant difference
    // but only if there's an admin note indicating intentional change
    const estimatedPrice = getEstimatedPrice(specificData, serviceType);
    console.log('Estimated price:', estimatedPrice);
    
    const adminNotes = pricingFactors?.adminNotes || specificData?.adminNotes;
    if (estimatedPrice > 0 && adminNotes) {
      const difference = Math.abs(finalPrice - estimatedPrice);
      console.log('Price difference:', difference);
      console.log('Difference > 0.01:', difference > 0.01);
      return difference > 0.01; // Allow for small floating point differences
    }
    
    // If no explicit indication from admin, it's not considered a change
    console.log('No price change detected');
    return false;
  };

  // Helper function to determine if price confirmation should be shown
  const shouldShowPriceConfirmation = (item) => {
    console.log('=== DEBUG shouldShowPriceConfirmation ===');
    console.log('Item status:', item.status);
    console.log('Item final_price:', item.final_price);
    console.log('Item specific_data:', item.specific_data);
    console.log('Item service_type:', item.service_type);
    
    const isPriceConfirmationStatus = item.status === 'price_confirmation';
    console.log('Is price confirmation status:', isPriceConfirmationStatus);
    
    // For customization orders, show price confirmation if status is price_confirmation
    // The status itself indicates admin has made changes
    if ((item.service_type === 'customization' || item.service_type === 'customize') && isPriceConfirmationStatus) {
      console.log('Customization order with price_confirmation status - showing buttons');
      return true;
    }
    
    const priceChanged = hasPriceChanged(item.specific_data, parseFloat(item.final_price), item.service_type, item.pricing_factors);
    console.log('Price changed result:', priceChanged);
    
    // Show price confirmation only if:
    // 1. Status is 'price_confirmation'
    // 2. Price has actually been changed by admin (not just set)
    const result = isPriceConfirmationStatus && priceChanged;
    console.log('Should show price confirmation:', result);
    
    return result;
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
            specific_data: item.specific_data,
            pricing_factors: item.pricing_factors,
            rental_start_date: item.rental_start_date,
            rental_end_date: item.rental_end_date
          });
        }
      });
    });

    // Sort: pending orders first, then by order date (newest first)
    allItems.sort((a, b) => {
      // Priority order for statuses (lower number = higher priority)
      const statusPriority = {
        'pending': 0,
        'price_confirmation': 1,
        'in_progress': 2,
        'ready_to_pickup': 3,
        'completed': 4,
        'cancelled': 5
      };
      
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, sort by date (newest first)
      return new Date(b.order_date) - new Date(a.order_date);
    });

    return allItems;
  };

  // Get status counts for filter badges
  const getStatusCounts = () => {
    const counts = {
      all: 0,
      pending: 0,
      accepted: 0,
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
          className="back-to-home-btn"
          onClick={() => navigate('/user-home')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Home</span>
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
            <div style={{ flex: 1 }}>
              <div className="user-name">{user.first_name} {user.last_name}</div>
              <button 
                onClick={async () => {
                  setLoadingMeasurements(true);
                  setMeasurementsModalOpen(true);
                  const result = await getMyMeasurements();
                  if (result.success && result.measurements) {
                    setMeasurements(result.measurements);
                  } else {
                    setMeasurements(null);
                  }
                  setLoadingMeasurements(false);
                }}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#8B4513',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#6B3410'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#8B4513'}
              >
                View Measurements
              </button>
            </div>
          </div>
        </div>

        <h2 className="section-title">Order Tracking</h2>

        {/* Filters Row with Dropdowns */}
        <div className="filters-row" style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {/* Service Filter Dropdown */}
          <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="service-filter" style={{ fontWeight: 'bold', color: '#333' }}>Service:</label>
            <select
              id="service-filter"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="filter-dropdown"
              style={{
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="all">All Services ({getServiceCounts().all})</option>
              <option value="repair">Repair ({getServiceCounts().repair})</option>
              <option value="customize">Customize ({getServiceCounts().customize})</option>
              <option value="dry_cleaning">Dry Cleaning ({getServiceCounts().dry_cleaning})</option>
              <option value="rental">Rental ({getServiceCounts().rental})</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="status-filter" style={{ fontWeight: 'bold', color: '#333' }}>Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-dropdown"
              style={{
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              <option value="all">All Status ({getStatusCounts().all})</option>
              <option value="pending">Pending ({getStatusCounts().pending})</option>
              <option value="price_confirmation">Price Confirmation ({getStatusCounts().price_confirmation})</option>
              <option value="in_progress">In Progress ({getStatusCounts().in_progress})</option>
              <option value="ready_to_pickup">Ready to Pickup ({getStatusCounts().ready_to_pickup})</option>
              <option value="completed">Completed ({getStatusCounts().completed})</option>
              <option value="cancelled">Cancelled ({getStatusCounts().cancelled})</option>
            </select>
          </div>
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
                const priceChanged = hasPriceChanged(item.specific_data, item.final_price, item.service_type, item.pricing_factors);
                
                // Calculate remaining amount for rental items with "rented" status
                const isRentalRented = item.service_type === 'rental' && item.status === 'rented';
                const downpayment = parseFloat(item.pricing_factors?.downpayment || item.specific_data?.downpayment || 0);
                const finalPrice = parseFloat(item.final_price || 0);
                const remainingAmount = isRentalRented ? Math.max(0, finalPrice - downpayment) : finalPrice;

                return (
                  <div key={`${item.order_id}-${item.order_item_id}-${item.service_type}-${item.status_updated_at || Date.now()}`} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3 className="order-id">ORD-{item.order_id}</h3>
                        <span className="service-type">
                          {formatServiceType(item.service_type)}
                          {item.specific_data?.serviceName && (
                            <span className="service-name">
                              {" " + formatServiceName(item.specific_data.serviceName)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="order-price">
                        {isRentalRented ? (
                          <>
                            <div style={{ fontSize: '14px', color: '#666', textDecoration: 'line-through' }}>
                              ₱{finalPrice.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>
                              ₱{remainingAmount.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                              Remaining
                            </div>
                          </>
                        ) : (
                          `₱${finalPrice.toFixed(2)}`
                        )}
                      </div>
                    </div>

                    <div className="order-status">
                      <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Price Comparison */}
                    {(estimatedPrice > 0 || item.final_price > 0) && (
                      <div className="price-comparison">
                        {isRentalRented ? (
                          <>
                            <div className="price-row">
                              <span className="price-label">Total Rental Price:</span>
                              <span className="price-value final">₱{finalPrice.toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                              <span className="price-label">Downpayment Paid:</span>
                              <span className="price-value" style={{ color: '#4caf50' }}>-₱{downpayment.toFixed(2)}</span>
                            </div>
                            <div className="price-row" style={{ borderTop: '2px solid #e0e0e0', paddingTop: '8px', marginTop: '8px' }}>
                              <span className="price-label" style={{ fontWeight: 'bold', fontSize: '16px' }}>Remaining Amount:</span>
                              <span className="price-value" style={{ fontWeight: 'bold', fontSize: '18px', color: '#ff9800' }}>
                                ₱{remainingAmount.toFixed(2)}
                              </span>
                            </div>
                            <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '6px', fontSize: '13px', color: '#666' }}>
                              💡 Pay the remaining amount when you return the rental item.
                            </div>
                          </>
                        ) : item.status === 'pending' ? (
                          // For pending status, only show estimated price if available
                          estimatedPrice > 0 ? (
                            <div className="price-row">
                              <span className="price-label">Estimated Price:</span>
                              <span className="price-value estimated">₱{estimatedPrice.toFixed(2)}</span>
                            </div>
                          ) : null
                        ) : item.status === 'price_confirmation' && estimatedPrice > 0 ? (
                          // For price_confirmation status, show both estimated and final price
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
                            {priceChanged && item.specific_data?.adminNotes && (
                              <div className="admin-notes">
                                <span className="notes-label">Admin Note:</span>
                                <span className="notes-text">{item.specific_data.adminNotes}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          // For other statuses (accepted, in_progress, etc.), show final price
                          <div className="price-row">
                            <span className="price-label">Final Price:</span>
                            <span className="price-value final">₱{parseFloat(item.final_price).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Downpayment Amount for Rental (Ready to Pick Up) */}
                    {item.service_type === 'rental' && (item.status === 'ready_to_pickup' || item.status === 'ready_for_pickup') && (
                      <div className="downpayment-info" style={{
                        background: '#fff3e0',
                        border: '2px solid #ff9800',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '20px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '24px' }}>💰</span>
                          <strong style={{ color: '#e65100', fontSize: '16px' }}>Downpayment Payment Required</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                          Please pay the downpayment amount when picking up your rental item from the store.
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>
                          Downpayment Amount: ₱{parseFloat(item.pricing_factors?.downpayment || item.specific_data?.downpayment || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div className="order-timeline">
                      <div className="timeline-container">
                        {/* Conditional timeline based on service type */}
                        {item.service_type === 'rental' ? (
                          <>
                            {/* Rental Timeline: Order Placed → Ready to Pick Up → Rented → Returned */}
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
                          </>
                        ) : (
                          <>
                            {/* Default Timeline for Repair/Dry Cleaning/Customize */}
                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'pending')}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'pending')}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Order Placed</div>
                                <div className="timeline-date">{formatDate(item.order_date)}</div>
                              </div>
                            </div>

                            {/* Always show Price Confirmation step for all orders */}
                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'price_confirmation', item.service_type)}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'price_confirmation', item.service_type)}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Price Confirmation</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'price_confirmation', item.service_type)}</div>
                              </div>
                            </div>
                            
                            {/* Always show Accepted step */}
                            <div className={`timeline-item ${getTimelineItemClass(item.status, 'accepted', item.service_type)}`}>
                              <div className={`timeline-dot ${getStatusDotClass(item.status, 'accepted', item.service_type)}`}></div>
                              <div className="timeline-content">
                                <div className="timeline-title">Accepted</div>
                                <div className="timeline-date">{getTimelineDate(item.status_updated_at, item.status, 'accepted', item.service_type)}</div>
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

                    {/* Price Confirmation Actions - Only show when admin has actually edited the price */}
                    {(() => {
                      const showConfirmation = shouldShowPriceConfirmation(item);
                      console.log('=== RENDERING PRICE CONFIRMATION ACTIONS ===');
                      console.log('Item:', item);
                      console.log('Show confirmation:', showConfirmation);
                      console.log('Item status:', item.status);
                      console.log('Item specific_data:', item.specific_data);
                      console.log('Item final_price:', item.final_price);
                      console.log('Has price changed result:', hasPriceChanged(item.specific_data, parseFloat(item.final_price), item.service_type, item.pricing_factors));
                      return showConfirmation ? (
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
                      ) : null;
                    })()}

                    <div className="order-footer">
                      <div className="order-dates">
                        <span className="date-info">Requested: {formatDate(item.order_date)}</span>
                        <span className="date-info">Updated: {formatDate(item.status_updated_at)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="btn-view-details"
                          onClick={() => handleViewDetails(item)}
                        >
                          View Details
                        </button>
                        {/* Show cancel button for rentals (bundled and single) and other services */}
                        {/* Show cancel button for rentals (bundled and single) and other services that are not completed/cancelled/returned */}
                        {item.status !== 'cancelled' && item.status !== 'completed' && item.status !== 'returned' && (
                          <button
                            className="btn-cancel"
                            onClick={() => {
                              setItemToCancel(item);
                              setCancelReason('');
                              setCancelModalOpen(true);
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              transition: 'background 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#da190b'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
          }
        </div >
      </main >

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
                    <span className="summary-value">
                      {(() => {
                        const isRentalRented = selectedItem.service_type === 'rental' && selectedItem.status === 'rented';
                        const downpayment = parseFloat(selectedItem.pricing_factors?.downpayment || selectedItem.specific_data?.downpayment || 0);
                        const finalPrice = parseFloat(selectedItem.final_price || 0);
                        const remainingAmount = isRentalRented ? Math.max(0, finalPrice - downpayment) : finalPrice;
                        
                        if (isRentalRented) {
                          return (
                            <div>
                              <div style={{ fontSize: '14px', color: '#666', textDecoration: 'line-through', marginBottom: '4px' }}>
                                ₱{finalPrice.toFixed(2)}
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>
                                ₱{remainingAmount.toFixed(2)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                (Remaining after downpayment)
                              </div>
                            </div>
                          );
                        }
                        
                        // For pending status, show estimated price if available, otherwise show final price
                        if (selectedItem.status === 'pending') {
                          const estimatedPrice = getEstimatedPrice(selectedItem.specific_data, selectedItem.service_type);
                          if (estimatedPrice > 0) {
                            return `₱${estimatedPrice.toFixed(2)} (Estimated)`;
                          }
                        }
                        
                        // For price_confirmation or other statuses, show final price
                        return `₱${finalPrice.toFixed(2)}`;
                      })()}
                    </span>
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
                {/* Price Confirmation Actions in Modal */}
                {shouldShowPriceConfirmation(selectedItem) && (
                  <div className="price-confirmation-actions" style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                    <div className="confirmation-message">
                      <strong>Price Update Required</strong>
                      <p>Please review the updated pricing and confirm to proceed.</p>
                    </div>
                    <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button className="btn-accept-price" onClick={() => {
                        handleAcceptPrice(selectedItem);
                        closeDetailsModal();
                      }}>
                        Accept Price - Continue
                      </button>
                      <button className="btn-decline-price" onClick={() => {
                        handleDeclinePrice(selectedItem);
                        closeDetailsModal();
                      }}>
                        Decline Price
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  {/* Show cancel button for rentals (bundled and single) and other services that are not completed/cancelled/returned */}
                  {selectedItem.status !== 'cancelled' && selectedItem.status !== 'completed' && selectedItem.status !== 'returned' && (
                    <button
                      onClick={() => {
                        setItemToCancel(selectedItem);
                        setCancelReason('');
                        setCancelModalOpen(true);
                        closeDetailsModal();
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#da190b'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
                    >
                      Cancel Order
                    </button>
                  )}
                  <button className="btn-secondary" onClick={closeDetailsModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        imageUrl={previewImageUrl}
        altText={previewImageAlt}
        onClose={() => setImagePreviewOpen(false)}
      />

      {/* Measurements Modal */}
      {measurementsModalOpen && (
        <div 
          className="details-modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMeasurementsModalOpen(false);
            }
          }}
        >
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h3>My Measurements</h3>
              <button className="details-modal-close" onClick={() => setMeasurementsModalOpen(false)}>×</button>
            </div>
            <div className="details-modal-content">
              {loadingMeasurements ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading measurements...</div>
              ) : measurements ? (
                <div>
                  {/* Top Measurements */}
                  {measurements.top && Object.keys(measurements.top).length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#333', fontSize: '1.1rem', fontWeight: '600', borderBottom: '2px solid #8B4513', paddingBottom: '8px' }}>Top Measurements</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Measurement</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Value (inches)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(measurements.top).map(([key, value], idx) => {
                            if (!value || value === '' || value === '0') return null;
                            // Format label to match admin input labels
                            const labelMap = {
                              'chest': 'Chest',
                              'shoulders': 'Shoulders',
                              'sleeveLength': 'Sleeve Length',
                              'neck': 'Neck',
                              'waist': 'Waist',
                              'length': 'Length'
                            };
                            const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
                            return (
                              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontWeight: '500', color: '#000' }}>{label}</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}>{value}"</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Bottom Measurements */}
                  {measurements.bottom && Object.keys(measurements.bottom).length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#333', fontSize: '1.1rem', fontWeight: '600', borderBottom: '2px solid #8B4513', paddingBottom: '8px' }}>Bottom Measurements</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Measurement</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Value (inches)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(measurements.bottom).map(([key, value], idx) => {
                            if (!value || value === '' || value === '0') return null;
                            // Format label to match admin input labels
                            const labelMap = {
                              'waist': 'Waist',
                              'hips': 'Hips',
                              'inseam': 'Inseam',
                              'length': 'Length',
                              'thigh': 'Thigh',
                              'outseam': 'Outseam'
                            };
                            const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
                            return (
                              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontWeight: '500', color: '#000' }}>{label}</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}>{value}"</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Notes */}
                  {measurements.notes && (
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                      <strong style={{ display: 'block', marginBottom: '8px', color: '#333' }}>Notes:</strong>
                      <p style={{ margin: 0, color: '#666' }}>{measurements.notes}</p>
                    </div>
                  )}

                  {(!measurements.top || Object.keys(measurements.top).length === 0) && 
                   (!measurements.bottom || Object.keys(measurements.bottom).length === 0) && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      No measurements have been recorded yet. Please contact the admin to add your measurements.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No measurements have been recorded yet. Please contact the admin to add your measurements.
                </div>
              )}
            </div>
            <div className="details-modal-footer">
              <button className="btn-secondary" onClick={() => setMeasurementsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && itemToCancel && (
        <div 
          className="details-modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCancelModalOpen(false);
              setItemToCancel(null);
              setCancelReason('');
            }
          }}
        >
          <div className="details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="details-modal-header">
              <h3>Cancel Service</h3>
              <button className="details-modal-close" onClick={() => {
                setCancelModalOpen(false);
                setItemToCancel(null);
                setCancelReason('');
              }}>×</button>
            </div>
            <div className="details-modal-content">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Are you sure you want to cancel this service? Please provide a reason for cancellation.
              </p>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Cancellation Reason <span style={{ color: '#f44336' }}>*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>
            </div>
            <div className="details-modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setCancelModalOpen(false);
                  setItemToCancel(null);
                  setCancelReason('');
                }}
                disabled={cancelling}
              >
                Close
              </button>
              <button
                onClick={async () => {
                  if (!cancelReason.trim()) {
                    await alert('Please provide a cancellation reason', 'Required', 'warning');
                    return;
                  }

                  setCancelling(true);
                  const result = await cancelOrderItem(itemToCancel.order_item_id, cancelReason.trim());
                  
                  if (result.success) {
                    await alert('Service cancelled successfully', 'Success', 'success');
                    setCancelModalOpen(false);
                    setItemToCancel(null);
                    setCancelReason('');
                    // Refresh orders
                    const ordersResult = await getUserOrderTracking();
                    if (ordersResult.success) {
                      const filteredOrders = ordersResult.data.map(order => ({
                        ...order,
                        items: order.items.filter(item =>
                          item.status !== 'cancelled' &&
                          item.status !== 'rejected' &&
                          item.status !== 'price_declined'
                        )
                      })).filter(order => order.items.length > 0);
                      setOrders(filteredOrders);
                    }
                  } else {
                    await alert(result.message || 'Failed to cancel service', 'Error', 'error');
                  }
                  setCancelling(false);
                }}
                disabled={cancelling || !cancelReason.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: cancelling || !cancelReason.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  opacity: cancelling || !cancelReason.trim() ? 0.6 : 1
                }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Profile;