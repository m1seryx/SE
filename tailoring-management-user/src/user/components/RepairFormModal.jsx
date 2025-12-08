import React, { useState, useEffect } from 'react';
import { addRepairToCart, uploadRepairImage } from '../../api/RepairApi';
import { getAvailableSlots, bookSlot } from '../../api/AppointmentSlotApi';
import '../../styles/RepairFormModal.css';

const RepairFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  const [formData, setFormData] = useState({
    damageLevel: '',
    garmentType: '',
    notes: '',
    date: '',
    time: ''
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);

  // Damage levels with base prices
  const damageLevels = [
    { value: 'minor', label: 'Minor', basePrice: 300, description: 'Small tears, loose threads, missing buttons' },
    { value: 'moderate', label: 'Moderate', basePrice: 500, description: 'Broken zippers, medium tears, seam repairs' },
    { value: 'major', label: 'Major', basePrice: 800, description: 'Large tears, structural damage, extensive repairs' },
    { value: 'severe', label: 'Severe', basePrice: 1500, description: 'Complete reconstruction, multiple major issues' }
  ];

  const garmentTypes = [
    'Shirt', 'Pants', 'Jacket', 'Coat', 'Dress', 'Skirt', 'Suit', 'Blouse', 'Sweater', 'Other'
  ];

  // Calculate estimated price when damage level or garment type changes
  useEffect(() => {
    if (formData.damageLevel) {
      calculateEstimatedPrice();
    }
  }, [formData.damageLevel, formData.garmentType]);

  // Load available time slots when date changes
  useEffect(() => {
    if (formData.date) {
      loadAvailableSlots(formData.date);
    } else {
      setAvailableTimeSlots([]);
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [formData.date]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        damageLevel: '',
        garmentType: '',
        notes: '',
        date: '',
        time: ''
      });
      setAvailableTimeSlots([]);
      setImageFile(null);
      setImagePreview('');
      setEstimatedPrice(0);
      setMessage('');
    }
  }, [isOpen]);

  const calculateEstimatedPrice = async () => {
    if (!formData.damageLevel) {
      setEstimatedPrice(0);
      return;
    }

    setPriceLoading(true);
    
    try {
      // Get base price from damage level
      const damageLevel = damageLevels.find(level => level.value === formData.damageLevel);
      let basePrice = damageLevel ? damageLevel.basePrice : 500;
      
      // Add garment type complexity factor
      let garmentMultiplier = 1.0;
      if (formData.garmentType === 'Suit' || formData.garmentType === 'Coat') {
        garmentMultiplier = 1.3;
      } else if (formData.garmentType === 'Dress') {
        garmentMultiplier = 1.2;
      }

      const finalPrice = Math.round(basePrice * garmentMultiplier);
      setEstimatedPrice(finalPrice);

      // Also try to get price from API if available
      try {
        const apiResult = await getPriceEstimate(formData.damageLevel);
        if (apiResult.success && apiResult.data.length > 0) {
          console.log('API price estimate available:', apiResult.data);
        }
      } catch (apiError) {
        console.log('API price estimate not available, using local calculation');
      }
    } catch (error) {
      console.error('Price calculation error:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadAvailableSlots = async (date) => {
    if (!date) return;
    
    // Check if date is Monday-Saturday
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek === 0) {
      setMessage('Appointments are only available Monday to Saturday');
      setAvailableTimeSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const result = await getAvailableSlots('repair', date);
      if (result.success) {
        setAvailableTimeSlots(result.slots || []);
        setMessage('');
      } else {
        setMessage(result.message || 'Error loading available time slots');
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setMessage('Error loading available time slots');
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Get minimum date (today) and filter out Sundays
  const getMinDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // If today is Sunday, start from Monday
    if (dayOfWeek === 0) {
      today.setDate(today.getDate() + 1);
    }
    return today.toISOString().split('T')[0];
  };

  // Filter out Sundays from date input
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0) {
        setMessage('Appointments are only available Monday to Saturday. Please select another date.');
        setFormData(prev => ({ ...prev, date: '', time: '' }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, date: selectedDate, time: '' }));
    setMessage('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    
    // Create preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.damageLevel || !formData.garmentType || !formData.notes || !formData.date || !formData.time) {
      setMessage('Please fill in all required fields including date and time');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // First, book the appointment slot
      let slotResult = null;
      try {
        slotResult = await bookSlot('repair', formData.date, formData.time);
        if (!slotResult || !slotResult.success) {
          const errorMsg = slotResult?.message || 'Failed to book appointment slot. This time may already be taken.';
          console.error('Slot booking failed:', slotResult);
          setMessage(errorMsg);
          setLoading(false);
          return;
        }
        console.log('Slot booked successfully:', slotResult);
      } catch (slotError) {
        console.error('Slot booking error:', slotError);
        const errorMsg = slotError.response?.data?.message || slotError.message || 'Failed to book appointment slot. Please try again.';
        setMessage(errorMsg);
        setLoading(false);
        return;
      }

      let imageUrl = '';
      
      // Upload image if provided
      if (imageFile) {
        console.log('Uploading image file:', imageFile);
        console.log('File details:', {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        });
        
        const uploadResult = await uploadRepairImage(imageFile);
        console.log('Upload result:', uploadResult);
        
        if (uploadResult.success) {
          imageUrl = uploadResult.data.url || uploadResult.data.filename || '';
          console.log('Image uploaded successfully, URL:', imageUrl);
        } else {
          console.warn('Image upload failed, continuing without image:', uploadResult.message);
          setMessage(`⚠️ Image upload failed: ${uploadResult.message}. Continuing without image.`);
        }
      } else {
        console.log('No image file provided');
      }

      // Combine date and time for pickupDate
      const pickupDateTime = `${formData.date}T${formData.time}`;

      const repairData = {
        serviceId: 1,
        serviceName: `${formData.damageLevel} Repair`,
        basePrice: estimatedPrice.toString(),
        estimatedPrice: estimatedPrice.toString(),
        damageLevel: formData.damageLevel,
        damageDescription: formData.notes,
        damageLocation: formData.garmentType,
        garmentType: formData.garmentType,
        pickupDate: pickupDateTime,
        imageUrl: imageUrl || 'no-image'
      };

      console.log('Repair data to send:', repairData);

      const result = await addRepairToCart(repairData);
      console.log('Add to cart result:', result);
      
      if (result.success) {
        // Slot is already booked and will be linked to cart item in the backend
        setMessage(`✅ Repair service added to cart! Estimated price: ₱${estimatedPrice}${imageUrl ? ' (Image uploaded)' : ''}`);
        setTimeout(() => {
          onClose();
          if (onCartUpdate) onCartUpdate();
        }, 1500);
      } else {
        console.error('Cart addition failed:', result);
        setMessage(`❌ Error: ${result.message || 'Failed to add to cart. Please try again.'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Failed to add repair service');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const formatDropOffDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleClose = () => {
    setFormData({
      damageLevel: '',
      garmentType: '',
      notes: '',
      datetime: ''
    });
    setImageFile(null);
    setMessage('');
    setEstimatedPrice(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="repair-form-modal-overlay" onClick={handleClose}>
      <div className="repair-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="repair-form-header">
          <h2>Repair Service</h2>
          <button className="repair-form-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="repair-form-content">
          {/* Damage Level */}
          <div className="form-group">
            <label htmlFor="damageLevel">Damage Level *</label>
            <select
              id="damageLevel"
              name="damageLevel"
              value={formData.damageLevel}
              onChange={handleInputChange}
              required
            >
              <option value="">Select damage level</option>
              {damageLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {/* Show all damage level descriptions */}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              {damageLevels.map(level => (
                <div key={level.value} style={{ marginBottom: '5px' }}>
                  <strong>{level.label}:</strong> {level.description}
                </div>
              ))}
            </div>
          </div>

          {/* Garment Type */}
          <div className="form-group">
            <label htmlFor="garmentType">Garment Type *</label>
            <select
              id="garmentType"
              name="garmentType"
              value={formData.garmentType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select garment type</option>
              {garmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Detailed Description *</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Please describe the damage in detail (size, location, extent of damage)..."
              rows={4}
              required
            />
            <small>Examples: 2-inch hole in left sleeve, broken zipper on jacket back, torn seam on pants</small>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image">Upload Damage Photo (Recommended)</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Damage preview" className="preview-image" />
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    document.getElementById('image').value = '';
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            )}
            
            {imageFile && !imagePreview && (
              <div className="file-info">
                <span>📎 {imageFile.name}</span>
              </div>
            )}
            <small>Photos help us provide accurate pricing and better service</small>
          </div>

          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">Drop off date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleDateChange}
              min={getMinDate()}
              required
            />
            <small>Available Monday to Saturday only</small>
          </div>

          {/* Time Slot */}
          {formData.date && (
            <div className="form-group">
              <label htmlFor="time">Available Time Slots *</label>
              {loadingSlots ? (
                <div>Loading available time slots...</div>
              ) : availableTimeSlots.length > 0 ? (
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Time Slot --</option>
                  {availableTimeSlots.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.display}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ color: '#d32f2f' }}>
                  No available time slots for this date. Please select another date.
                </div>
              )}
            </div>
          )}

          {/* Price Estimate */}
          {estimatedPrice > 0 && (
            <div className="price-estimate">
              <h4>Estimated Price: ₱{estimatedPrice}</h4>
              <p>Based on damage level: {formData.damageLevel} • Garment type: {formData.garmentType}</p>
              <p className="estimated-pickup">Drop off item date: {formData.date && formData.time ? formatDropOffDate(`${formData.date}T${formData.time}`) : 'Not set'}</p>
              <p>Final price will be confirmed after admin review</p>
            </div>
          )}

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading || !estimatedPrice}>
              {loading ? 'Adding...' : `Add to Cart - ₱${estimatedPrice}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairFormModal;
