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

const Cart = ({ isOpen, onClose, onCartUpdate }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState({ itemCount: 0, totalAmount: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(''); // Added appointment date state

  // Load cart when component opens
  useEffect(() => {
    if (isOpen) {
      loadCart();
      loadSummary();
    }
  }, [isOpen]);

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
    if (!window.confirm('Are you sure you want to remove this item?')) {
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
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    // Check if appointment date is required and not set
    if (!appointmentDate) {
      setError('Please select an appointment date');
      return;
    }

    if (!window.confirm('Are you sure you want to submit this order?')) {
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      // Pass appointment date along with order notes
      const result = await submitCart(orderNotes, appointmentDate);
      if (result.success) {
        setSuccess('Order submitted successfully!');
        setCartItems([]);
        setSummary({ itemCount: 0, totalAmount: 0 });
        setOrderNotes('');
        setAppointmentDate(''); // Reset appointment date
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
    if (!window.confirm('Are you sure you want to clear your entire cart?')) {
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
        setOrderNotes('');
        setAppointmentDate(''); // Reset appointment date
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
          <h2>Service Cart</h2>
          <button className="cart-close-btn" onClick={onClose}>×</button>
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
                {cartItems.map((item) => (
                  <div key={item.cart_id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{getServiceTypeDisplay(item.service_type)}</h4>
                      <p>Service ID: {item.service_id}</p>
                      <p>Base Price: {formatPrice(item.base_price)}</p>
                      
                      {/* Debug: Log item data */}
                      {console.log('Cart item:', item)}
                      
                      {/* Show estimated price for repair and dry cleaning, final price for others */}
                      {(item.service_type === 'repair' || item.service_type === 'dry_cleaning') ? (
                        <p>Estimated Price: {formatPrice(item.final_price)}</p>
                      ) : (
                        <p>Final Price: {formatPrice(item.final_price)}</p>
                      )}
                      
                      {/* Show repair details */}
                      {item.service_type === 'repair' && item.specific_data && (
                        <div className="repair-details">
                          <p>Damage Level: {item.specific_data.damageLevel || 'N/A'}</p>
                          <p>Garment: {item.specific_data.garmentType || 'N/A'}</p>
                          <p>Description: {item.specific_data.damageDescription || 'N/A'}</p>
                          <p>Pickup Date: {item.specific_data.pickupDate || 'N/A'}</p>
                          
                          {/* Show damage photo if available */}
                          {item.specific_data.imageUrl && item.specific_data.imageUrl !== 'no-image' && (
                            <div className="cart-item-image">
                              <img 
                                src={`http://localhost:5000${item.specific_data.imageUrl}`} 
                                alt="Damage preview" 
                                className="cart-damage-photo"
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
                          <p>Brand: {item.specific_data.brand || 'N/A'}</p>
                          <p>Quantity: {item.specific_data.quantity || 'N/A'} items</p>
                          <p>Pickup Date: {item.specific_data.pickupDate || 'N/A'}</p>
                          <p>Estimated Time: {item.specific_data.estimatedTime || '2-3 days'}</p>
                          
                          {/* Show clothing photo if available */}
                          {item.specific_data.imageUrl && item.specific_data.imageUrl !== 'no-image' && (
                            <div className="cart-item-image">
                              <img 
                                src={`http://localhost:5000${item.specific_data.imageUrl}`} 
                                alt="Clothing preview" 
                                className="cart-damage-photo"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <small>Clothing photo uploaded</small>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Debug: Log customization data */}
                      {item.service_type === 'customization' && console.log('Customization item data:', item.specific_data)}
                      
                      {/* Show customization details */}
                      {item.service_type === 'customize' && item.specific_data && (
                        <div className="customization-details">
                          <p>Service Name: {item.specific_data.serviceName || 'Customization Service'}</p>
                          <p>Style Complexity: {item.specific_data.styleComplexity || 'N/A'}</p>
                          <p>Garment: {item.specific_data.garmentType || item.specific_data.clothingType || 'N/A'}</p>
                          <p>Details: {item.specific_data.customizationDetails || 'N/A'}</p>
                          <p>Pickup Date: {item.specific_data.pickupDate || 'N/A'}</p>
                          
                          {/* Show 2D customization details if available */}
                          {(item.specific_data.clothingType || item.specific_data.variantId || item.specific_data.fabricType) && (
                            <>
                              <p>Clothing Type: {item.specific_data.clothingType || 'N/A'}</p>
                              <p>Variant: {item.specific_data.variantId || 'N/A'}</p>
                              <p>Gender: {item.specific_data.gender || 'N/A'}</p>
                              <p>Fabric: {item.specific_data.fabricType || 'N/A'}</p>
                              <p>Pattern: {item.specific_data.patternType || 'N/A'}</p>
                              {item.specific_data.colorValue && item.specific_data.colorValue !== '#000000' && (
                                <p>Color: <span style={{backgroundColor: item.specific_data.colorValue, padding: '2px 8px', borderRadius: '4px', color: '#fff'}}>{item.specific_data.colorValue}</span></p>
                              )}
                              <p>Fit: {item.specific_data.clothingFit || 'N/A'}</p>
                            </>
                          )}
                          
                          {/* Show customization photo if available */}
                          {item.specific_data.imageUrl && item.specific_data.imageUrl !== 'no-image' && (
                            <div className="cart-item-image">
                              <img 
                                src={`http://localhost:5000${item.specific_data.imageUrl}`} 
                                alt="Customization preview" 
                                className="cart-damage-photo"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <small>Reference image uploaded</small>
                            </div>
                          )}
                          
                          {/* Show AI preview if available */}
                          {item.specific_data.aiImageUrl && item.specific_data.aiImageUrl !== '' && (
                            <div className="cart-item-image">
                              <img 
                                src={item.specific_data.aiImageUrl} 
                                alt="AI customization preview" 
                                className="cart-damage-photo"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <small>AI preview generated</small>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {item.appointment_date && (
                        <p>Appointment: {new Date(item.appointment_date).toLocaleDateString()}</p>
                      )}
                      
                      {/* Updated to show duration instead of date range */}
                      {item.duration_days && (
                        <p>
                          Rental Duration: {item.duration_days} day{item.duration_days !== 1 ? 's' : ''}
                        </p>
                      )}
                      
                      {/* Fallback for backward compatibility with start/end dates */}
                      {!item.duration_days && item.rental_start_date && item.rental_end_date && (
                        <p>
                          Rental: {new Date(item.rental_start_date).toLocaleDateString()} - {' '}
                          {new Date(item.rental_end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="cart-item-actions">
                      <div className="cart-quantity">
                        <label>Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleUpdateQuantity(item.cart_id, parseInt(e.target.value))}
                          disabled={loading}
                        />
                      </div>

                      
                      <button 
                        className="cart-remove-btn"
                        onClick={() => handleRemoveItem(item.cart_id)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-summary-row">
                  <span>Items ({summary.itemCount}):</span>
                  <span>{formatPrice(summary.totalAmount)}</span>
                </div>
                
                {/* Appointment Date Selection */}
                <div className="cart-appointment-date">
                  <label>Select Appointment Date:</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
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
                    disabled={loading || submitting || cartItems.length === 0}
                  >
                    {submitting ? 'Submitting...' : 'Submit Order'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;