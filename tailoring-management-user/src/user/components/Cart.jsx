import React, { useState, useEffect } from 'react';
import '../../styles/Cart.css';
import { 
  getUserCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart, 
  submitCart,
  getCartSummary
} from '../../api/CartApi';
import ImagePreviewModal from '../../components/ImagePreviewModal';
import { useAlert } from '../../context/AlertContext';
import { getRentalImageUrl } from '../../api/RentalApi';

const Cart = ({ isOpen, onClose, onCartUpdate }) => {
  const { confirm } = useAlert();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState({ itemCount: 0, totalAmount: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedDetails, setExpandedDetails] = useState(new Set()); // Track which items have expanded 3D details
  
  // Image preview modal state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageAlt, setPreviewImageAlt] = useState('');
  
  // Bundle modal state
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [bundleItems, setBundleItems] = useState([]);

  // Function to open image preview
  const openImagePreview = (imageUrl, altText) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageAlt(altText || 'Cart Item Image');
    setImagePreviewOpen(true);
  };

  // Function to close image preview
  const closeImagePreview = () => {
    setImagePreviewOpen(false);
    setPreviewImageUrl('');
    setPreviewImageAlt('');
  };

  // Function to open bundle modal
  const openBundleModal = (items) => {
    setBundleItems(items);
    setBundleModalOpen(true);
  };

  // Function to close bundle modal
  const closeBundleModal = () => {
    setBundleModalOpen(false);
    setBundleItems([]);
  };

  // Load cart when component opens
  useEffect(() => {
    if (isOpen) {
      loadCart();
      loadSummary();
      // Select all items by default
      setSelectedItems([]);
    }
  }, [isOpen]);

  // Update selected items when cart items change
  useEffect(() => {
    if (cartItems.length > 0 && selectedItems.length === 0) {
      // Auto-select all items when cart loads
      setSelectedItems(cartItems.map(item => item.cart_id));
    }
  }, [cartItems]);

  // Toggle item selection
  const toggleItemSelection = (cartId) => {
    setSelectedItems(prev => 
      prev.includes(cartId) 
        ? prev.filter(id => id !== cartId)
        : [...prev, cartId]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.cart_id));
    }
  };

  // Toggle 3D customization details expansion
  const toggleDetailsExpansion = (cartId) => {
    setExpandedDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cartId)) {
        newSet.delete(cartId);
      } else {
        newSet.add(cartId);
      }
      return newSet;
    });
  };

  const loadCart = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getUserCart();
      if (result.success) {
        setCartItems(result.items || []);
      } else {
        setError(result.message || 'Error loading cart');
      }
    } catch (err) {
      setError('Failed to load cart');
      console.error('Load cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const result = await getCartSummary();
      if (result.success) {
        setSummary({
          itemCount: result.itemCount || 0,
          totalAmount: result.totalAmount || 0
        });
      }
    } catch (err) {
      console.error('Load summary error:', err);
    }
  };

  const handleRemoveItem = async (cartId) => {
    const confirmed = await confirm('Are you sure you want to remove this item?', 'Remove Item', 'warning');
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await removeFromCart(cartId);
      if (result.success) {
        setSuccess('Item removed from cart');
        await loadCart();
        await loadSummary();
        if (onCartUpdate) onCartUpdate();
      } else {
        setError(result.message || 'Error removing item');
      }
    } catch (err) {
      setError('Failed to remove item');
      console.error('Remove item error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleUpdateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await updateCartItem(cartId, { quantity: newQuantity });
      if (result.success) {
        await loadCart();
        await loadSummary();
        if (onCartUpdate) onCartUpdate();
      } else {
        setError(result.message || 'Error updating item');
      }
    } catch (err) {
      setError('Failed to update item');
      console.error('Update item error:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to submit');
      return;
    }

    const confirmed = await confirm(`Are you sure you want to submit ${selectedItems.length} selected item(s)?`, 'Submit Order', 'warning');
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      // Submit only selected items
      const result = await submitCart(orderNotes, selectedItems);
      if (result.success) {
        setSuccess('Order submitted successfully!');
        // Remove submitted items from cart
        setCartItems(prev => prev.filter(item => !selectedItems.includes(item.cart_id)));
        setSelectedItems([]);
        await loadSummary();
        if (onCartUpdate) onCartUpdate();
        
        // Close cart after successful submission
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message || 'Error submitting order');
      }
    } catch (err) {
      setError('Failed to submit order');
      console.error('Submit order error:', err);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  const handleClearCart = async () => {
    const confirmed = await confirm('Are you sure you want to clear your entire cart?', 'Clear Cart', 'warning');
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await clearCart();
      if (result.success) {
        setSuccess('Cart cleared successfully');
        setCartItems([]);
        setSummary({ itemCount: 0, totalAmount: 0 });
        if (onCartUpdate) onCartUpdate();
      } else {
        setError(result.message || 'Error clearing cart');
      }
    } catch (err) {
      setError('Failed to clear cart');
      console.error('Clear cart error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatDateTo12Hour = (dateString) => {
    if (!dateString || dateString === 'N/A') return dateString;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
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

  const getServiceTypeDisplay = (serviceType) => {
    const types = {
      'rental': 'Rental',
      'dry_cleaning': 'Dry Cleaning',
      'repair': 'Repair',
      'customization': 'Customization'
    };
    return types[serviceType] || serviceType;
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
              Select All
            </label>
            <button className="cart-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {error && <div className="cart-error">{error}</div>}
        {success && <div className="cart-success">{success}</div>}

        <div className="cart-content">
          {loading ? (
            <div className="cart-loading">Loading cart...</div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty</p>
              <button className="cart-continue-btn" onClick={onClose}>
               Book a service
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map((item) => {
                  // Check if it's a rental bundle
                  const isBundle = item.specific_data?.is_bundle || item.pricing_factors?.is_bundle;
                  const bundleItems = item.specific_data?.bundle_items || [];
                  
                  // Get rental image URL
                  const rentalImageUrl = item.service_type === 'rental' 
                    ? (item.specific_data?.image_url || (bundleItems.length > 0 ? bundleItems[0]?.image_url : null))
                    : null;

                  return (
                  <div 
                    key={item.cart_id} 
                    className="cart-item" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '10px',
                      cursor: isBundle ? 'pointer' : 'default'
                    }}
                    onClick={isBundle ? () => openBundleModal(bundleItems) : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.cart_id)}
                      onChange={() => toggleItemSelection(item.cart_id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginTop: '5px', cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    
                    {/* Rental Image */}
                    {item.service_type === 'rental' && rentalImageUrl && (
                      <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                        <img 
                          src={rentalImageUrl} 
                          alt={item.specific_data?.item_name || 'Rental Item'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="cart-item-info" style={{ flex: 1 }}>
                      <h4>{getServiceTypeDisplay(item.service_type)}</h4>
                      {isBundle && (
                        <p style={{ color: '#007bff', fontWeight: '500', marginBottom: '5px' }}>
                          Bundle ({bundleItems.length} items) - Click to view
                        </p>
                      )}
                      <p>Service ID: {item.service_id}</p>
                      
                      {/* Show different pricing based on service type */}
                      {item.service_type === 'rental' ? (
                        <>
                          <p>Rental Price: {formatPrice(item.final_price)}</p>
                          <p>Downpayment: {formatPrice(item.pricing_factors?.downpayment || item.specific_data?.downpayment || 0)}</p>
                        </>
                      ) : item.service_type === 'dry_cleaning' && item.specific_data?.isEstimatedPrice ? (
                        <p>Estimated Price: {formatPrice(item.final_price)}</p>
                      ) : item.service_type === 'dry_cleaning' ? (
                        <p>Final Price: {formatPrice(item.final_price)}</p>
                      ) : (
                        <p>Estimated Price: {formatPrice(item.final_price)}</p>
                      )}
                      
                      {/* Show repair details */}
                      {item.service_type === 'repair' && item.specific_data && (
                        <div className="repair-details">
                          <p>Damage Level: {item.specific_data.damageLevel || 'N/A'}</p>
                          <p>Garment: {item.specific_data.garmentType || 'N/A'}</p>
                          <p>Description: {item.specific_data.damageDescription || 'N/A'}</p>
                          <p>Drop off preferred date: {formatDateTo12Hour(item.specific_data.pickupDate) || 'N/A'}</p>
                          
                          {/* Show damage photo if available */}
                          {item.specific_data.imageUrl && item.specific_data.imageUrl !== 'no-image' && (
                            <div className="cart-item-image">
                              <img 
                                src={`http://localhost:5000${item.specific_data.imageUrl}`} 
                                alt="Damage preview" 
                                className="cart-damage-photo clickable-image"
                                onClick={() => openImagePreview(`http://localhost:5000${item.specific_data.imageUrl}`, 'Damage Photo')}
                                title="Click to enlarge"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <small>Damage photo uploaded</small>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show dry cleaning details */}
                      {item.service_type === 'dry_cleaning' && item.specific_data && (
                        <div className="drycleaning-details">
                          {item.specific_data.garmentType && (
                            <p>Garment Type: {item.specific_data.garmentType.charAt(0).toUpperCase() + item.specific_data.garmentType.slice(1)}</p>
                          )}
                          <p>Brand: {item.specific_data.brand || 'N/A'}</p>
                          <p>Quantity: {item.specific_data.quantity || 'N/A'} items</p>
                          <p>Drop off date: {formatDateTo12Hour(item.specific_data.pickupDate) || 'N/A'}</p>
                          {item.specific_data.pricePerItem && (
                            <p>Price per item: ₱{parseFloat(item.specific_data.pricePerItem).toFixed(2)}</p>
                          )}
                          
                          {/* Show clothing photo if available */}
                          {item.specific_data.imageUrl && item.specific_data.imageUrl !== 'no-image' && (
                            <div className="cart-item-image">
                              <img 
                                src={`http://localhost:5000${item.specific_data.imageUrl}`} 
                                alt="Clothing preview" 
                                className="cart-damage-photo clickable-image"
                                onClick={() => openImagePreview(`http://localhost:5000${item.specific_data.imageUrl}`, 'Clothing Photo')}
                                title="Click to enlarge"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <small>Clothing photo uploaded</small>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show customization details */}
                      {item.service_type === 'customization' && item.specific_data && (
                        <div className="customization-details">
                          <p>Garment Type: {item.specific_data.garmentType || 'N/A'}</p>
                          <p>Fabric Type: {item.specific_data.fabricType || 'N/A'}</p>
                          <p>Preferred Date: {item.specific_data.preferredDate || 'N/A'}</p>
                          {item.specific_data.notes && (
                            <p>Notes: {item.specific_data.notes}</p>
                          )}
                          
                          {/* Display 3D customization choices if available */}
                          {item.specific_data.designData && (
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedDetails.has(item.cart_id) ? '10px' : '0' }}>
                                <strong>3D Customization Details:</strong>
                                <button
                                  onClick={() => toggleDetailsExpansion(item.cart_id)}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '11px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontWeight: '400'
                                  }}
                                >
                                  {expandedDetails.has(item.cart_id) ? '▼ Hide' : '▶ Show'}
                                </button>
                              </div>
                              
                              {expandedDetails.has(item.cart_id) ? (
                                <div>
                                  {item.specific_data.designData.size && (
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Size: {item.specific_data.designData.size.charAt(0).toUpperCase() + item.specific_data.designData.size.slice(1)}</p>
                                  )}
                                  {item.specific_data.designData.fit && (
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Fit: {item.specific_data.designData.fit.charAt(0).toUpperCase() + item.specific_data.designData.fit.slice(1)}</p>
                                  )}
                                  {item.specific_data.designData.colors && item.specific_data.designData.colors.fabric && (
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                      Color: {getColorName(item.specific_data.designData.colors.fabric)}
                                    </p>
                                  )}
                                  {item.specific_data.designData.pattern && item.specific_data.designData.pattern !== 'none' && (
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Pattern: {item.specific_data.designData.pattern.charAt(0).toUpperCase() + item.specific_data.designData.pattern.slice(1)}</p>
                                  )}
                                  {item.specific_data.designData.personalization && item.specific_data.designData.personalization.initials && (
                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                      Personalization: {item.specific_data.designData.personalization.initials}
                                      {item.specific_data.designData.personalization.font && ` (${item.specific_data.designData.personalization.font} font)`}
                                    </p>
                                  )}
                                  {item.specific_data.designData.buttons && item.specific_data.designData.buttons.length > 0 && (
                                    <div style={{ marginTop: '5px' }}>
                                      <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>Button Types:</p>
                                      {item.specific_data.designData.buttons.map((btn, index) => (
                                        <p key={btn.id || index} style={{ margin: '2px 0 2px 15px', fontSize: '13px' }}>
                                          Button {index + 1}: {getButtonType(btn.modelPath)}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {item.specific_data.designData.accessories && item.specific_data.designData.accessories.length > 0 && (
                                    <div style={{ marginTop: '5px' }}>
                                      <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>Accessories:</p>
                                      {item.specific_data.designData.accessories.map((acc, index) => (
                                        <p key={acc.id || index} style={{ margin: '2px 0 2px 15px', fontSize: '13px' }}>
                                          {getAccessoryName(acc.modelPath)}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p style={{ margin: '0', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                                  Click "Show Details" to view all 3D customization choices
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Show design preview if available */}
                          {item.specific_data.imageUrl && item.specific_data.imageUrl !== 'no-image' && (
                            <div className="cart-item-image">
                              <img 
                                src={`http://localhost:5000${item.specific_data.imageUrl}`} 
                                alt="Design preview" 
                                className="cart-damage-photo clickable-image"
                                onClick={() => openImagePreview(`http://localhost:5000${item.specific_data.imageUrl}`, 'Design Preview')}
                                title="Click to enlarge"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <small>Design preview uploaded</small>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {item.appointment_date && (
                        <p>Appointment: {new Date(item.appointment_date).toLocaleDateString()}</p>
                      )}
                      
                      {item.rental_start_date && item.rental_end_date && (
                        <p style={{ color: '#000' }}>
                          Rental: <span style={{ color: '#000', fontWeight: '600' }}>{new Date(item.rental_start_date).toLocaleDateString()}</span> - {' '}
                          <span style={{ color: '#000', fontWeight: '600' }}>{new Date(item.rental_end_date).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>

                    <div className="cart-item-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="cart-quantity">
                        <label>Qty:</label>
                        <span className="quantity-display">{item.quantity || 1}</span>
                      </div>

                      
                      <button 
                        className="cart-remove-btn"
                        onClick={() => handleRemoveItem(item.cart_id)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>

              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>Selected Items ({selectedItems.length}):</span>
                  <span>{formatPrice(
                    cartItems
                      .filter(item => selectedItems.includes(item.cart_id))
                      .reduce((total, item) => total + (parseFloat(item.final_price) * (item.quantity || 1)), 0)
                  )}</span>
                </div>
                
                <div className="cart-notes">
                  <label>Order Notes (optional):</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Add any special instructions..."
                    rows={3}
                  />
                </div>

                <div className="cart-actions">
                  <button 
                    className="cart-clear-btn"
                    onClick={handleClearCart}
                    disabled={loading || submitting}
                  >
                    Clear Cart
                  </button>
                  
                  <button 
                    className="cart-submit-btn"
                    onClick={handleSubmitOrder}
                    disabled={loading || submitting || selectedItems.length === 0}
                  >
                    {submitting ? 'Submitting...' : `Submit Order (${selectedItems.length})`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        imageUrl={previewImageUrl}
        altText={previewImageAlt}
        onClose={closeImagePreview}
      />

      {/* Bundle Modal */}
      {bundleModalOpen && (
        <div className="cart-overlay" style={{ zIndex: 2000 }} onClick={closeBundleModal}>
          <div 
            className="bundle-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 2001
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Rental Bundle Items</h2>
              <button
                onClick={closeBundleModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {bundleItems.map((bundleItem, index) => (
                <div 
                  key={index}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onClick={() => {
                    if (bundleItem.image_url) {
                      openImagePreview(bundleItem.image_url, bundleItem.item_name || 'Rental Item');
                    }
                  }}
                >
                  {bundleItem.image_url ? (
                    <img
                      src={bundleItem.image_url}
                      alt={bundleItem.item_name || 'Rental Item'}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '150px',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}>
                      No Image
                    </div>
                  )}
                  <div style={{ padding: '10px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      {bundleItem.item_name || 'Rental Item'}
                    </p>
                    {bundleItem.brand && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                        {bundleItem.brand}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
