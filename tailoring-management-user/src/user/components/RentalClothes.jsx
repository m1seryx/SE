import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRentals, getRentalImageUrl } from '../../api/RentalApi';
import { addToCart } from '../../api/CartApi';
import brown from "../../assets/brown.png";
import full from "../../assets/full.png";
import tuxedo from "../../assets/tuxedo.png";
import suitSample from "../../assets/suits.png";

const RentalClothes = ({ openAuthModal, showAll = false }) => {
  const [rentalItems, setRentalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [cartMessage, setCartMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();
  
  // Multi-select state
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Fallback items for when API fails
  const fallbackItems = [
    { name: 'Brown Suit', price: 'P 800', img: brown, id: 1, daily_rate: 800, base_rental_fee: 500, deposit_amount: 1000 },
    { name: 'Full Suit', price: 'P 800', img: full, id: 2, daily_rate: 800, base_rental_fee: 500, deposit_amount: 1000 },
    { name: 'Tuxedo', price: 'P 800', img: tuxedo, id: 3, daily_rate: 800, base_rental_fee: 500, deposit_amount: 1000 },
  ];

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const result = await getAllRentals();
        if (result.items && result.items.length > 0) {
          // Transform API data to match component structure
          const transformedItems = result.items.map(item => ({
            ...item,
            img: item.image_url ? getRentalImageUrl(item.image_url) : suitSample,
            price: item.daily_rate ? `P ${item.daily_rate}/day` : 'P 800/day'
          }));
          setRentalItems(transformedItems);
        } else {
          // Use fallback items if API returns empty
          setRentalItems(fallbackItems);
        }
      } catch (error) {
        console.error('Error fetching rentals:', error);
        // Use fallback items on error
        setRentalItems(fallbackItems);
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSeeMore = () => {
    navigate('/rentals');
  };

  // Calculate rental cost
  const calculateTotalCost = (start, end, item) => {
    if (!start || !end || !item) return 0;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (endDate <= startDate) return 0;
    
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const dailyRate = parseFloat(item.daily_rate) || 0;
    const baseFee = parseFloat(item.base_rental_fee) || 0;
    
    return baseFee + (dailyRate * days);
  };

  // Calculate total cost for multiple items
  const calculateMultiTotalCost = (start, end, items) => {
    if (!start || !end || !items || items.length === 0) return 0;
    return items.reduce((total, item) => total + calculateTotalCost(start, end, item), 0);
  };

  // Calculate total deposit for multiple items
  const calculateMultiDeposit = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => total + (parseFloat(item.deposit_amount) || 0), 0);
  };

  // Toggle item selection
  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(i => (i.id || i.item_id) === (item.id || item.item_id));
      if (isSelected) {
        return prev.filter(i => (i.id || i.item_id) !== (item.id || item.item_id));
      } else {
        return [...prev, item];
      }
    });
  };

  // Check if item is selected
  const isItemSelected = (item) => {
    return selectedItems.some(i => (i.id || i.item_id) === (item.id || item.item_id));
  };

  // Open date modal for multi-select
  const openDateModal = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    setStartDate('');
    setEndDate('');
    setTotalCost(0);
    setCartMessage('');
    setIsDateModalOpen(true);
  };

  // Close date modal
  const closeDateModal = () => {
    setIsDateModalOpen(false);
  };

  // Handle date changes
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate) {
      if (isMultiSelectMode && selectedItems.length > 0) {
        const cost = calculateMultiTotalCost(date, endDate, selectedItems);
        setTotalCost(cost);
      } else if (selectedItem) {
        const cost = calculateTotalCost(date, endDate, selectedItem);
        setTotalCost(cost);
      }
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (startDate) {
      if (isMultiSelectMode && selectedItems.length > 0) {
        const cost = calculateMultiTotalCost(startDate, date, selectedItems);
        setTotalCost(cost);
      } else if (selectedItem) {
        const cost = calculateTotalCost(startDate, date, selectedItem);
        setTotalCost(cost);
      }
    }
  };

  // Reset dates and cost when modal opens/closes
  const openModal = (item) => {
    console.log('openModal called with item:', item);
    setSelectedItem(item);
    setStartDate('');
    setEndDate('');
    setTotalCost(0);
    setCartMessage('');
    setIsModalOpen(true);
    console.log('isModalOpen set to true');
  };

  // Handle adding rental to cart
  const handleAddToCart = async () => {
    if (!selectedItem || !startDate || !endDate) {
      setCartMessage('Please select rental dates');
      return;
    }

    setAddingToCart(true);
    setCartMessage('');

    try {
      const rentalData = {
        serviceType: 'rental',
        serviceId: selectedItem.id || selectedItem.item_id,
        quantity: 1,
        basePrice: selectedItem.base_rental_fee || selectedItem.base_fee || '0',
        finalPrice: totalCost.toString(),
        pricingFactors: {
          daily_rate: selectedItem.daily_rate || '800',
          days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
          deposit_amount: selectedItem.deposit_amount || '0'
        },
        specificData: {
          item_name: selectedItem.item_name || selectedItem.name || 'Rental Item',
          brand: selectedItem.brand || 'Unknown',
          size: selectedItem.size || 'Standard',
          category: selectedItem.category || 'rental',
          image_url: getRentalImageUrl(selectedItem.image_url)
        },
        rentalDates: {
          startDate: startDate,
          endDate: endDate
        }
      };

      const result = await addToCart(rentalData);
      
      if (result.success) {
        setCartMessage(`✅ ${selectedItem.item_name || selectedItem.name} added to cart!`);
        // Close modal after successful addition
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setStartDate('');
          setEndDate('');
          setTotalCost(0);
        }, 1500);
      } else {
        setCartMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      setCartMessage('❌ Failed to add item to cart');
    } finally {
      setAddingToCart(false);
      // Clear message after 3 seconds
      setTimeout(() => setCartMessage(''), 3000);
    }
  };

  // Handle adding multiple rentals to cart as one bundle
  const handleAddMultipleToCart = async () => {
    if (selectedItems.length === 0 || !startDate || !endDate) {
      setCartMessage('Please select items and rental dates');
      return;
    }

    setAddingToCart(true);
    setCartMessage('');

    try {
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const totalDeposit = calculateMultiDeposit(selectedItems);
      
      // Create bundle of all selected items
      const itemsBundle = selectedItems.map(item => ({
        id: item.id || item.item_id,
        item_name: item.item_name || item.name || 'Rental Item',
        brand: item.brand || 'Unknown',
        size: item.size || 'Standard',
        category: item.category || 'rental',
        daily_rate: item.daily_rate || 800,
        base_rental_fee: item.base_rental_fee || 0,
        deposit_amount: item.deposit_amount || 0,
        image_url: getRentalImageUrl(item.image_url),
        individual_cost: calculateTotalCost(startDate, endDate, item)
      }));

      const rentalData = {
        serviceType: 'rental',
        serviceId: itemsBundle[0].id, // Primary item ID
        quantity: selectedItems.length,
        basePrice: itemsBundle.reduce((sum, item) => sum + (parseFloat(item.base_rental_fee) || 0), 0).toString(),
        finalPrice: totalCost.toString(),
        pricingFactors: {
          daily_rate: 'varies',
          days: days,
          deposit_amount: totalDeposit.toString(),
          is_bundle: true,
          item_count: selectedItems.length
        },
        specificData: {
          is_bundle: true,
          bundle_items: itemsBundle,
          item_names: itemsBundle.map(i => i.item_name).join(', '),
          item_name: `Rental Bundle (${selectedItems.length} items)`,
          brand: 'Multiple',
          size: 'Various',
          category: 'rental_bundle'
        },
        rentalDates: {
          startDate: startDate,
          endDate: endDate
        }
      };

      const result = await addToCart(rentalData);
      
      if (result.success) {
        setCartMessage(`✅ ${selectedItems.length} items added to cart as bundle!`);
        // Reset after successful addition
        setTimeout(() => {
          setIsDateModalOpen(false);
          setSelectedItems([]);
          setIsMultiSelectMode(false);
          setStartDate('');
          setEndDate('');
          setTotalCost(0);
        }, 1500);
      } else {
        setCartMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      setCartMessage('❌ Failed to add items to cart');
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(''), 3000);
    }
  };

  // Show only 3 items on homepage, all items on rental page
  const displayItems = showAll ? rentalItems : rentalItems.slice(0, 3);

  if (loading) {
    return (
      <section className="rental" id="Rentals">
        <div className="section-header">
          <h2>Rental Clothes</h2>
          {!showAll && <a onClick={handleSeeMore} className="see-more">See more →</a>}
        </div>
        <div className="rental-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rental-card loading">
              <div className="loading-placeholder"></div>
              <div className="rental-info">
                <h3>Loading...</h3>
                <p className="price">P ---</p>
                <button className="btn-view" disabled>Loading...</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rental" id="Rentals">
        <div className="section-header">
          <h2>{showAll ? 'All Rental Clothes' : 'Rental Clothes'}</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* Multi-select toggle button */}
            <button
              onClick={() => {
                if (isMultiSelectMode) {
                  setIsMultiSelectMode(false);
                  setSelectedItems([]);
                } else {
                  setIsMultiSelectMode(true);
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: isMultiSelectMode ? '2px solid #dc3545' : '2px solid #007bff',
                backgroundColor: isMultiSelectMode ? '#dc3545' : '#007bff',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              {isMultiSelectMode ? '✕ Cancel Selection' : '☑ Select Multiple'}
            </button>
            {!showAll && rentalItems.length > 3 && (
              <a onClick={handleSeeMore} className="see-more">See more →</a>
            )}
          </div>
        </div>
        <div className="rental-grid">
          {displayItems.map((item, i) => (
            <div 
              key={i} 
              className="rental-card"
              style={{
                position: 'relative',
                border: isMultiSelectMode && isItemSelected(item) ? '3px solid #007bff' : '1px solid #ddd',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (isMultiSelectMode) {
                  toggleItemSelection(item);
                }
              }}
            >
              {/* Checkbox overlay for multi-select mode */}
              {isMultiSelectMode && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  zIndex: 10,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isItemSelected(item) ? '#007bff' : 'white',
                  border: isItemSelected(item) ? '2px solid #007bff' : '2px solid #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {isItemSelected(item) && (
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>✓</span>
                  )}
                </div>
              )}
              <img src={item.img} alt={item.name} style={{ 
                opacity: isMultiSelectMode ? 0.9 : 1,
                cursor: isMultiSelectMode ? 'pointer' : 'default'
              }} />
              <div className="rental-info">
                <h3>{item.item_name || item.name}</h3>
                <p className="price">{item.price}</p>
                {!isMultiSelectMode && (
                  <button onClick={() => openModal(item)} className="btn-view">View</button>
                )}
                {isMultiSelectMode && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: isItemSelected(item) ? '#e3f2fd' : '#f8f9fa',
                    borderRadius: '5px',
                    fontSize: '13px',
                    color: isItemSelected(item) ? '#1976d2' : '#666',
                    fontWeight: isItemSelected(item) ? '600' : '400'
                  }}>
                    {isItemSelected(item) ? '✓ Selected' : 'Tap to select'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating selection bar for multi-select */}
      {isMultiSelectMode && selectedItems.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1a1a2e',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}>
          <span style={{ fontSize: '15px' }}>
            <strong>{selectedItems.length}</strong> item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <span style={{ color: '#aaa' }}>|</span>
          <span style={{ fontSize: '14px', color: '#aaa' }}>
            Est. Deposit: ₱{calculateMultiDeposit(selectedItems).toLocaleString()}
          </span>
          <button
            onClick={openDateModal}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Set Dates & Add to Cart →
          </button>
        </div>
      )}

      {/* Multi-select Date Modal */}
      {isDateModalOpen && selectedItems.length > 0 && (
        <div className="modal" onClick={closeDateModal} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <span className="close" onClick={closeDateModal} style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              fontSize: '24px',
              cursor: 'pointer'
            }}>×</span>
            
            <h2 style={{ marginBottom: '20px', color: '#1a1a2e' }}>
              Rental Bundle ({selectedItems.length} items)
            </h2>
            
            {/* Selected Items Preview */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px'
            }}>
              {selectedItems.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  border: '1px solid #ddd',
                  fontSize: '13px'
                }}>
                  <img 
                    src={item.img} 
                    alt={item.item_name || item.name} 
                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span>{item.item_name || item.name}</span>
                  <button
                    onClick={() => toggleItemSelection(item)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      padding: '2px',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            {/* Date Selection */}
            <div className="date-section" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div className="date-input-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#000' }}>Start Date</label>
                  <input 
                    type="date" 
                    className="date-input" 
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      color: '#000',
                      backgroundColor: '#fff'
                    }}
                  />
                </div>
                <div className="date-input-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#000' }}>End Date</label>
                  <input 
                    type="date" 
                    className="date-input" 
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      color: '#000',
                      backgroundColor: '#fff'
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Cost Breakdown for Bundle */}
            {totalCost > 0 && (
              <div className="cost-breakdown" style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <h4 style={{ marginBottom: '15px', color: '#1a1a2e' }}>Payment Summary</h4>
                
                <div className="cost-disclaimer" style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '10px 15px',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '18px' }}>⚠️</span>
                  <span style={{ fontSize: '13px', color: '#856404' }}>
                    Note: Final cost may vary based on actual rental duration and item condition upon return.
                  </span>
                </div>
                
                {/* Individual item costs */}
                <div style={{ marginBottom: '15px' }}>
                  {selectedItems.map((item, idx) => {
                    const itemCost = calculateTotalCost(startDate, endDate, item);
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #eee',
                        fontSize: '14px'
                      }}>
                        <span>{item.item_name || item.name}</span>
                        <span>₱{itemCost.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="cost-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  color: '#28a745',
                  fontWeight: '600'
                }}>
                  <span>Total Security Deposit (Due Now):</span>
                  <span>₱{calculateMultiDeposit(selectedItems).toLocaleString()}</span>
                </div>
                
                <div className="cost-total" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderTop: '2px solid #1a1a2e',
                  marginTop: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#1a1a2e'
                }}>
                  <span>Total Rental Cost (Due on Return):</span>
                  <span>₱{totalCost.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            {/* Cart Message */}
            {cartMessage && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                backgroundColor: cartMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: cartMessage.includes('✅') ? '#155724' : '#721c24',
                textAlign: 'center'
              }}>
                {cartMessage}
              </div>
            )}
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeDateModal}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddMultipleToCart}
                disabled={!startDate || !endDate || totalCost <= 0 || addingToCart}
                style={{
                  padding: '12px 24px',
                  backgroundColor: (!startDate || !endDate || totalCost <= 0 || addingToCart) ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!startDate || !endDate || totalCost <= 0 || addingToCart) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {addingToCart ? 'Adding...' : `Add Bundle to Cart - ₱${calculateMultiDeposit(selectedItems).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rental Item Modal */}
      {isModalOpen && selectedItem && (
        <div className="modal" onClick={closeModal} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <span className="close" onClick={closeModal} style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              fontSize: '24px',
              cursor: 'pointer'
            }}>×</span>
            <div className="modal-body">
              <img src={selectedItem.img || suitSample} alt={selectedItem.name} className="modal-img" />
              <div className="modal-details">
                <h2>{selectedItem.item_name || selectedItem.name}</h2>
                
                <div className="detail-grid">
                  {/* Product Information */}
                  <div className="detail-section">
                    <h4>Product Information</h4>
                    <div className="detail-row">
                      <div className="detail-item">
                        <strong>Brand:</strong> {selectedItem.brand || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Category:</strong> {selectedItem.category || 'N/A'}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <strong>Size:</strong> {selectedItem.size || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Color:</strong> {selectedItem.color || 'N/A'}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <strong>Material:</strong> {selectedItem.material || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Base Fee:</strong> ₱{selectedItem.base_rental_fee || '0'}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                 
                </div>
                
                {selectedItem.description && (
                  <div className="description-section">
                    <strong>Description:</strong>
                    <p>{selectedItem.description}</p>
                  </div>
                )}
                
                {selectedItem.care_instructions && (
                  <div className="care-section">
                    <strong>Care Instructions:</strong>
                    <p>{selectedItem.care_instructions}</p>
                  </div>
                )}
                
                <div className="rental-actions">
                  <div className="date-section">
                    <div className="date-input-group">
                      <label>Start Date</label>
                      <input 
                        type="date" 
                        className="date-input" 
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="date-input-group">
                      <label>End Date</label>
                      <input 
                        type="date" 
                        className="date-input" 
                        value={endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  {totalCost > 0 && (
                    <div className="cost-breakdown">
                      <h4>Payment Details</h4>
                      <div className="cost-disclaimer" style={{
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        padding: '10px 15px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        <span style={{ fontSize: '13px', color: '#856404' }}>
                          Note: Final cost may vary based on actual rental duration and item condition upon return.
                        </span>
                      </div>
                      <div className="cost-item">
                        <span>Security Deposit (Due Now):</span>
                        <span>₱{selectedItem.deposit_amount || '0'}</span>
                      </div>
                      <div className="cost-item">
                        <span>Base Fee:</span>
                        <span>₱{selectedItem.base_rental_fee || '0'}</span>
                      </div>
                      <div className="cost-item">
                        <span>Daily Rate (₱{selectedItem.daily_rate || '800'} × {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days):</span>
                        <span>₱{(parseFloat(selectedItem.daily_rate) || 800) * Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))}</span>
                      </div>
                      <div className="cost-total">
                        <span>Total Rental Cost (Due on Return):</span>
                        <span>₱{totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Cart Message */}
                  {cartMessage && (
                    <div className={`cart-message ${cartMessage.includes('✅') ? 'success' : 'error'}`}>
                      {cartMessage}
                    </div>
                  )}
                  
                  <button 
                    className="btn-rent" 
                    onClick={handleAddToCart}
                    disabled={!startDate || !endDate || totalCost <= 0 || addingToCart}
                  >
                    {addingToCart ? 'Adding to Cart...' : `Add to Cart - ₱${selectedItem.deposit_amount || '0'}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RentalClothes;
