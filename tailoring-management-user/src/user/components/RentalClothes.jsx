import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRentals, getRentalImageUrl } from '../../api/RentalApi';
import { addToCart } from '../../api/CartApi';
import suitSample from "../../assets/suits.png";
import { useAlert } from '../../context/AlertContext';

// Measurements Dropdown Component
const MeasurementsDropdown = ({ measurements, item, isInModal = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginTop: isInModal ? '0' : '8px', marginBottom: isInModal ? '0' : '8px' }}>
      <div style={{ marginBottom: isInModal ? '10px' : '0' }}>
        {isInModal && <strong style={{ display: 'block', marginBottom: '10px' }}>Measurements:</strong>}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          style={{
            width: '100%',
            padding: isInModal ? '8px 12px' : '6px 10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: isInModal ? '14px' : '12px',
            color: '#495057',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
            fontWeight: isInModal ? '500' : 'normal'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
        >
          <span>Show Measurements</span>
          <span style={{ fontSize: isInModal ? '12px' : '10px', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>
      </div>
      
      {isOpen && (
        <div style={{
          marginTop: '8px',
          padding: isInModal ? '15px' : '10px',
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: isInModal ? '14px' : '11px',
          color: '#333',
          maxHeight: isInModal ? '300px' : '200px',
          overflowY: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {measurements.map((measurement, idx) => (
            <div key={idx} style={{ 
              padding: isInModal ? '6px 0' : '4px 0',
              borderBottom: idx < measurements.length - 1 ? '1px solid #f0f0f0' : 'none',
              fontSize: isInModal ? '14px' : '11px'
            }}>
              {measurement}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RentalClothes = ({ openAuthModal, showAll = false }) => {
  const { alert } = useAlert();
  const [rentalItems, setRentalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [rentalDuration, setRentalDuration] = useState(3); // Default to 3 days
  const [endDate, setEndDate] = useState(''); // Auto-calculated
  const [totalCost, setTotalCost] = useState(0);
  const [cartMessage, setCartMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();

  // Calculate end date from start date and duration
  const calculateEndDate = (start, duration) => {
    if (!start) return '';
    const startDateObj = new Date(start);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + duration - 1); // -1 because start date counts as day 1
    return endDateObj.toISOString().split('T')[0];
  };

  // Update end date and total cost when start date or duration changes
  useEffect(() => {
    if (startDate && rentalDuration) {
      const calculatedEndDate = calculateEndDate(startDate, rentalDuration);
      setEndDate(calculatedEndDate);
      // Calculate total cost based on duration
      if (selectedItem) {
        const cost = calculateTotalCost(rentalDuration, selectedItem);
        setTotalCost(cost);
      }
    } else {
      setEndDate('');
      setTotalCost(0);
    }
  }, [startDate, rentalDuration, selectedItem]);

  // Helper functions to determine measurement type
  const isTopCategory = (category) => {
    return ['suit', 'tuxedo', 'formal_wear', 'business'].includes(category);
  };

  const isBottomCategory = (category) => {
    return ['casual', 'pants', 'trousers'].includes(category);
  };

  // Get measurements summary for card display (compact format)
  const getMeasurementsSummary = (item) => {
    if (!item || !item.size) return null;
    
    try {
      let measurements;
      let sizeString = item.size;
      
      // Check if size is truncated (starts with { but doesn't end with })
      if (typeof sizeString === 'string' && sizeString.startsWith('{') && !sizeString.endsWith('}')) {
        // Truncated data - don't show it
        return null;
      }
      
      if (typeof sizeString === 'string') {
        try {
          measurements = JSON.parse(sizeString);
        } catch (parseError) {
          // Invalid JSON - likely truncated or corrupted
          return null;
        }
      } else {
        measurements = sizeString;
      }
      
      if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) {
        return null;
      }

      // Filter out empty values and create summary - only show measurements with actual values
      const parts = Object.entries(measurements)
        .filter(([key, value]) => {
          // Only include if value exists, is not empty string, not '0', and not null/undefined
          return value !== null && value !== undefined && value !== '' && value !== '0' && String(value).trim() !== '';
        })
        .map(([key, value]) => {
          // Format key names properly
          let label = key;
          // Handle camelCase
          label = label.replace(/([A-Z])/g, ' $1');
          // Capitalize first letter
          label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
          // Handle specific cases
          label = label.replace('sleeve length', 'Sleeve Length');
          label = label.replace('sleevelength', 'Sleeve Length');
          return `${label}: ${value}"`;
        });

      return parts.length > 0 ? parts : null;
    } catch (e) {
      return null;
    }
  };

  // Parse and format measurements for display
  const formatMeasurements = (item) => {
    if (!item || !item.size) return 'N/A';
    
    try {
      // Handle both string JSON and already parsed objects
      let measurements;
      if (typeof item.size === 'string') {
        // Try to parse as JSON
        try {
          measurements = JSON.parse(item.size);
        } catch (parseError) {
          // If it's not valid JSON, return as plain text
          return item.size;
        }
      } else {
        measurements = item.size;
      }
      
      // If it's not an object, return as is (backward compatibility)
      if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) {
        return typeof item.size === 'string' ? item.size : JSON.stringify(item.size);
      }

      const category = item.category || 'suit';
      
      if (isTopCategory(category)) {
        const parts = [];
        // Check for truthy values (not empty string, null, undefined, or 0)
        if (measurements.chest && measurements.chest !== '' && measurements.chest !== '0') {
          parts.push({ label: 'Chest', value: measurements.chest });
        }
        if (measurements.shoulders && measurements.shoulders !== '' && measurements.shoulders !== '0') {
          parts.push({ label: 'Shoulders', value: measurements.shoulders });
        }
        if (measurements.sleeveLength && measurements.sleeveLength !== '' && measurements.sleeveLength !== '0') {
          parts.push({ label: 'Sleeve Length', value: measurements.sleeveLength });
        }
        if (measurements.neck && measurements.neck !== '' && measurements.neck !== '0') {
          parts.push({ label: 'Neck', value: measurements.neck });
        }
        if (measurements.waist && measurements.waist !== '' && measurements.waist !== '0') {
          parts.push({ label: 'Waist', value: measurements.waist });
        }
        if (measurements.length && measurements.length !== '' && measurements.length !== '0') {
          parts.push({ label: 'Length', value: measurements.length });
        }
        
        return parts.length > 0 ? (
          <div>
            <strong style={{ display: 'block', marginBottom: '10px', color: '#333', fontSize: '1rem' }}>Top Measurements</strong>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Measurement</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Value (inches)</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', fontWeight: '500' }}>{part.label}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{part.value}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : 'No measurements available';
      } else if (isBottomCategory(category)) {
        const parts = [];
        if (measurements.waist && measurements.waist !== '' && measurements.waist !== '0') {
          parts.push({ label: 'Waist', value: measurements.waist });
        }
        if (measurements.hips && measurements.hips !== '' && measurements.hips !== '0') {
          parts.push({ label: 'Hips', value: measurements.hips });
        }
        if (measurements.inseam && measurements.inseam !== '' && measurements.inseam !== '0') {
          parts.push({ label: 'Inseam', value: measurements.inseam });
        }
        if (measurements.length && measurements.length !== '' && measurements.length !== '0') {
          parts.push({ label: 'Length', value: measurements.length });
        }
        if (measurements.thigh && measurements.thigh !== '' && measurements.thigh !== '0') {
          parts.push({ label: 'Thigh', value: measurements.thigh });
        }
        if (measurements.outseam && measurements.outseam !== '' && measurements.outseam !== '0') {
          parts.push({ label: 'Outseam', value: measurements.outseam });
        }
        
        return parts.length > 0 ? (
          <div>
            <strong style={{ display: 'block', marginBottom: '10px', color: '#333', fontSize: '1rem' }}>Bottom Measurements</strong>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Measurement</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Value (inches)</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', fontWeight: '500' }}>{part.label}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{part.value}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : 'No measurements available';
      } else {
        // For other categories, try to display if it's a valid object
        if (measurements && typeof measurements === 'object') {
          const parts = Object.entries(measurements)
            .filter(([key, value]) => value && value !== '' && value !== '0')
            .map(([key, value]) => ({ label: key.charAt(0).toUpperCase() + key.slice(1), value }));
          
          return parts.length > 0 ? (
            <div>
              <div style={{ marginLeft: '10px' }}>
                {parts.map((part, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: '500' }}>{part.label}:</span> {part.value}"
                  </div>
                ))}
              </div>
            </div>
          ) : (typeof item.size === 'string' ? item.size : 'N/A');
        }
        // For other categories, return as is
        return typeof item.size === 'string' ? item.size : JSON.stringify(item.size);
      }
    } catch (e) {
      console.error('Error formatting measurements:', e, 'Item size:', item.size);
      // If parsing fails, return as is (backward compatibility)
      return typeof item.size === 'string' ? item.size : 'N/A';
    }
  };
  
  // Multi-select state
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        setLoading(true);
        const result = await getAllRentals();
        if (result.items && result.items.length > 0) {
          // Transform API data to match component structure
          // IMPORTANT: Preserve all fields including size (which contains measurements as JSON)
          const transformedItems = result.items.map(item => ({
            ...item,
            img: item.image_url ? getRentalImageUrl(item.image_url) : suitSample,
            price: item.price ? `P ${item.price}` : 'P 500',
            // Ensure size field is preserved (contains measurements JSON)
            size: item.size || null,
            category: item.category || 'suit',
            // Preserve all other fields
            item_name: item.item_name,
            brand: item.brand,
            color: item.color,
            material: item.material
          }));
          setRentalItems(transformedItems);
        } else {
          // No items found - set empty array
          setRentalItems([]);
        }
      } catch (error) {
        console.error('Error fetching rentals:', error);
        // On error, set empty array
        setRentalItems([]);
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

  // Calculate rental cost using new formula: price = (rental_days / 3) * base_price_per_3_days
  const calculateTotalCost = (duration, item) => {
    if (!duration || !item || duration < 3) return 0;
    
    // Ensure duration is a multiple of 3
    const validDuration = Math.floor(duration / 3) * 3;
    if (validDuration < 3) return 0;
    
    // Get base price from item (price per 3 days)
    // Parse price - it might be a string like "P 500" or "500" or a number
    let basePrice = 500; // Default fallback
    if (item.price) {
      const priceStr = String(item.price).replace(/[^\d.]/g, ''); // Remove non-numeric chars except decimal
      const parsedPrice = parseFloat(priceStr);
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        basePrice = parsedPrice;
      }
    }
    
    // Formula: price = (rental_days / 3) * base_price_per_3_days
    return (validDuration / 3) * basePrice;
  };

  // Calculate total cost for multiple items (same duration for all)
  const calculateMultiTotalCost = (duration, items) => {
    if (!duration || !items || items.length === 0) return 0;
    return items.reduce((total, item) => total + calculateTotalCost(duration, item), 0);
  };

  // Calculate total downpayment for multiple items
  const calculateMultiDownpayment = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => total + (parseFloat(item.downpayment) || 0), 0);
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
  const openDateModal = async () => {
    if (selectedItems.length === 0) {
      await alert('Please select at least one item', 'Selection Required', 'warning');
      return;
    }
    setStartDate('');
    setRentalDuration(3);
    setEndDate('');
    setTotalCost(0);
    setCartMessage('');
    setIsDateModalOpen(true);
  };

  // Update total cost for bundle when start date or duration changes
  useEffect(() => {
    if (startDate && rentalDuration && selectedItems.length > 0 && isDateModalOpen) {
      const calculatedEndDate = calculateEndDate(startDate, rentalDuration);
      setEndDate(calculatedEndDate);
      const cost = calculateMultiTotalCost(rentalDuration, selectedItems);
      setTotalCost(cost);
    } else if (isDateModalOpen) {
      setEndDate('');
      setTotalCost(0);
    }
  }, [startDate, rentalDuration, selectedItems, isDateModalOpen]);

  // Close date modal
  const closeDateModal = () => {
    setIsDateModalOpen(false);
  };

  // Handle start date changes
  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  // Handle duration changes
  const handleDurationChange = (duration) => {
    setRentalDuration(parseInt(duration));
  };

  // Reset dates and cost when modal opens/closes
  const openModal = (item) => {
    console.log('openModal called with item:', item);
    setSelectedItem(item);
    setStartDate('');
    setRentalDuration(3);
    setEndDate('');
    setTotalCost(0);
    setCartMessage('');
    setIsModalOpen(true);
    console.log('isModalOpen set to true');
  };

  // Handle adding rental to cart
  const handleAddToCart = async () => {
    if (!selectedItem || !startDate || !rentalDuration) {
      setCartMessage('Please select start date and rental duration');
      return;
    }

    setAddingToCart(true);
    setCartMessage('');

    try {
      const rentalData = {
        serviceType: 'rental',
        serviceId: selectedItem.id || selectedItem.item_id,
        quantity: 1,
        basePrice: '0', // Not used in new system
        finalPrice: totalCost.toString(),
        pricingFactors: {
          duration: rentalDuration,
          price: totalCost,
          downpayment: selectedItem.downpayment || '0'
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
          endDate: endDate,
          duration: rentalDuration
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
          setRentalDuration(3);
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
    if (selectedItems.length === 0 || !startDate || !rentalDuration) {
      setCartMessage('Please select items, start date, and rental duration');
      return;
    }

    setAddingToCart(true);
    setCartMessage('');

    try {
      const totalDownpayment = calculateMultiDownpayment(selectedItems);
      
      // Create bundle of all selected items
      const itemsBundle = selectedItems.map(item => ({
        id: item.id || item.item_id,
        item_name: item.item_name || item.name || 'Rental Item',
        brand: item.brand || 'Unknown',
        size: item.size || 'Standard',
        category: item.category || 'rental',
        downpayment: item.downpayment || 0,
        image_url: getRentalImageUrl(item.image_url),
        individual_cost: calculateTotalCost(rentalDuration, item)
      }));

      const rentalData = {
        serviceType: 'rental',
        serviceId: itemsBundle[0].id, // Primary item ID
        quantity: selectedItems.length,
        basePrice: '0', // Not used in new system
        finalPrice: totalCost.toString(),
        pricingFactors: {
          duration: rentalDuration,
          price: totalCost,
          downpayment: totalDownpayment.toString(),
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
          endDate: endDate,
          duration: rentalDuration
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
          {displayItems.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#666',
              fontSize: '18px'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>No rental clothes</p>
            </div>
          ) : (
            displayItems.map((item, i) => (
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
            ))
          )}
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
            Est. Downpayment: ₱{calculateMultiDownpayment(selectedItems).toLocaleString()}
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#000' }}>Start Date *</label>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#000' }}>Rental Duration *</label>
                  <select 
                    className="date-input" 
                    value={rentalDuration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      color: '#000',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="3">3 days</option>
                    <option value="6">6 days</option>
                    <option value="9">9 days</option>
                    <option value="12">12 days</option>
                    <option value="15">15 days</option>
                    <option value="18">18 days</option>
                    <option value="21">21 days</option>
                    <option value="24">24 days</option>
                    <option value="27">27 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
                {endDate && (
                  <div className="date-input-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#000' }}>End Date (Auto-calculated)</label>
                    <input 
                      type="date" 
                      className="date-input" 
                      value={endDate}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        color: '#666',
                        backgroundColor: '#f5f5f5',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                )}
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
                    const itemCost = calculateTotalCost(rentalDuration, item);
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
                  <span>Total Downpayment (Due upon pick up):</span>
                  <span>₱{calculateMultiDownpayment(selectedItems).toLocaleString()}</span>
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
                disabled={!startDate || !rentalDuration || totalCost <= 0 || addingToCart}
                style={{
                  padding: '12px 24px',
                  backgroundColor: (!startDate || !rentalDuration || totalCost <= 0 || addingToCart) ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!startDate || !rentalDuration || totalCost <= 0 || addingToCart) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {addingToCart ? 'Adding...' : `Add Bundle to Cart - ₱${calculateMultiDownpayment(selectedItems).toLocaleString()}`}
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
                      <div className="detail-item" style={{ width: '100%' }}>
                        {(() => {
                          const measurementsSummary = getMeasurementsSummary(selectedItem);
                          if (measurementsSummary && measurementsSummary.length > 0) {
                            return (
                              <MeasurementsDropdown measurements={measurementsSummary} item={selectedItem} isInModal={true} />
                            );
                          }
                          return (
                            <div>
                              <strong style={{ display: 'block', marginBottom: '10px' }}>Measurements:</strong> 
                              <div style={{ marginTop: '5px', fontSize: '0.9rem', color: '#666' }}>
                                {formatMeasurements(selectedItem)}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <strong>Color:</strong> {selectedItem.color || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Material:</strong> {selectedItem.material || 'N/A'}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <strong>Price:</strong> ₱{selectedItem.price || '0'}
                      </div>
                      <div className="detail-item">
                        <strong>Downpayment:</strong> ₱{selectedItem.downpayment || '0'}
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
                      <label>Start Date *</label>
                      <input 
                        type="date" 
                        className="date-input" 
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="date-input-group">
                      <label>Rental Duration *</label>
                      <select 
                        className="date-input" 
                        value={rentalDuration}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          color: '#000',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="3">3 days</option>
                        <option value="6">6 days</option>
                        <option value="9">9 days</option>
                        <option value="12">12 days</option>
                        <option value="15">15 days</option>
                        <option value="18">18 days</option>
                        <option value="21">21 days</option>
                        <option value="24">24 days</option>
                        <option value="27">27 days</option>
                        <option value="30">30 days</option>
                      </select>
                    </div>
                    {endDate && (
                      <div className="date-input-group" style={{ gridColumn: '1 / -1' }}>
                        <label>End Date (Auto-calculated)</label>
                        <input 
                          type="date" 
                          className="date-input" 
                          value={endDate}
                          disabled
                          style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {totalCost > 0 && startDate && (
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
                        <span>Downpayment (Due Now):</span>
                        <span>₱{parseFloat(selectedItem.downpayment || '0').toFixed(2)}</span>
                      </div>
                      <div className="cost-item">
                        <span>Rental Price ({rentalDuration} days):</span>
                        <span>₱{totalCost.toFixed(2)}</span>
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
                    disabled={!startDate || !rentalDuration || totalCost <= 0 || addingToCart}
                  >
                    {addingToCart ? 'Adding to Cart...' : `Add to Cart - ₱${totalCost > 0 ? totalCost.toFixed(2) : (selectedItem.downpayment || '0')}`}
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
