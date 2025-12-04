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
  const [durationDays, setDurationDays] = useState(1); // Changed from startDate/endDate to duration
  const [totalCost, setTotalCost] = useState(0);
  const [cartMessage, setCartMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();

  // Fallback items for when API fails
  const fallbackItems = [
    { name: 'Brown Suit', price: 'P 800', img: brown },
    { name: 'Full Suit', price: 'P 800', img: full },
    { name: 'Tuxedo', price: 'P 800', img: tuxedo },
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

  // Calculate rental cost based on duration
  const calculateTotalCost = (days, item) => {
    if (!days || !item) return 0;
    
    const dailyRate = parseFloat(item.daily_rate) || 0;
    const baseFee = parseFloat(item.base_rental_fee) || 0;
    
    return baseFee + (dailyRate * days);
  };

  // Handle duration change
  const handleDurationChange = (days) => {
    setDurationDays(days);
    if (selectedItem) {
      const cost = calculateTotalCost(days, selectedItem);
      setTotalCost(cost);
    }
  };

  // Reset duration and cost when modal opens/closes
  const openModal = (item) => {
    console.log('openModal called with item:', item);
    setSelectedItem(item);
    setDurationDays(1); // Reset to 1 day
    setTotalCost(0);
    setCartMessage('');
    setIsModalOpen(true);
    console.log('isModalOpen set to true');
  };

  // Handle adding rental to cart
  const handleAddToCart = async () => {
    if (!selectedItem || durationDays < 1) {
      setCartMessage('Please select rental duration');
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
          days: durationDays, // Store duration days
          deposit_amount: selectedItem.deposit_amount || '0'
        },
        specificData: {
          item_name: selectedItem.item_name || selectedItem.name || 'Rental Item',
          brand: selectedItem.brand || 'Unknown',
          size: selectedItem.size || 'Standard',
          category: selectedItem.category || 'rental',
          image_url: getRentalImageUrl(selectedItem.image_url),
          duration_days: durationDays // Store duration in specific data as well
        }
        // Removed rentalDates object since we're using duration
      };

      const result = await addToCart(rentalData);
      
      if (result.success) {
        setCartMessage(`✅ ${selectedItem.item_name || selectedItem.name} added to cart!`);
        // Close modal after successful addition
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setDurationDays(1);
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
          {!showAll && rentalItems.length > 3 && (
            <a onClick={handleSeeMore} className="see-more">See more →</a>
          )}
        </div>
        <div className="rental-grid">
          {displayItems.map((item, i) => (
            <div key={i} className="rental-card">
              <img src={item.img} alt={item.name} />
              <div className="rental-info">
                <h3>{item.name}</h3>
                <p className="price">{item.price}</p>
                <button onClick={() => openModal(item)} className="btn-view">View</button>
              </div>
            </div>
          ))}
        </div>
      </section>

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
                  {/* Duration Selection */}
                  <div className="date-section">
                    <div className="date-input-group">
                      <label>Rental Duration (Days)</label>
                      <input 
                        type="number" 
                        className="date-input" 
                        value={durationDays}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="30"
                      />
                      <div className="duration-display">
                        {durationDays} day{durationDays !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {totalCost > 0 && (
                    <div className="cost-breakdown">
                      <h4>Payment Details</h4>
                      <div className="cost-item">
                        <span>Security Deposit (Due Now):</span>
                        <span>₱{selectedItem.deposit_amount || '0'}</span>
                      </div>
                      <div className="cost-item">
                        <span>Base Fee:</span>
                        <span>₱{selectedItem.base_rental_fee || '0'}</span>
                      </div>
                      <div className="cost-item">
                        <span>Daily Rate (₱{selectedItem.daily_rate || '800'} × {durationDays} day{durationDays !== 1 ? 's' : ''}):</span>
                        <span>₱{(parseFloat(selectedItem.daily_rate) || 800) * durationDays}</span>
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
                    disabled={durationDays < 1 || totalCost <= 0 || addingToCart}
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