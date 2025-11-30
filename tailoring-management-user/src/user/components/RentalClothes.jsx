import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRentals, getRentalImageUrl } from '../../api/RentalApi';
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

  // Handle date changes
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && selectedItem) {
      const cost = calculateTotalCost(date, endDate, selectedItem);
      setTotalCost(cost);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (startDate && selectedItem) {
      const cost = calculateTotalCost(startDate, date, selectedItem);
      setTotalCost(cost);
    }
  };

  // Reset dates and cost when modal opens/closes
  const openModal = (item) => {
    console.log('openModal called with item:', item);
    setSelectedItem(item);
    setStartDate('');
    setEndDate('');
    setTotalCost(0);
    setIsModalOpen(true);
    console.log('isModalOpen set to true');
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
                  
                  <button 
                    className="btn-rent" 
                    onClick={openAuthModal}
                    disabled={!startDate || !endDate || totalCost <= 0}
                  >
                    RENT NOW - ₱{selectedItem.deposit_amount || '0'}
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
