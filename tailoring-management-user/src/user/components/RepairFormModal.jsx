import React, { useState, useEffect } from 'react';
import { addRepairToCart, uploadRepairImage } from '../../api/RepairApi';
import '../../styles/RepairFormModal.css';

const RepairFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  const [formData, setFormData] = useState({
    damageLevel: '',
    garmentType: '',
    notes: '',
    datetime: ''
  });
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
    
    if (!formData.damageLevel || !formData.garmentType || !formData.notes || !formData.datetime) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
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

      const repairData = {
        serviceId: 1,
        serviceName: `${formData.damageLevel} Repair`,
        basePrice: estimatedPrice.toString(),
        estimatedPrice: estimatedPrice.toString(),
        damageLevel: formData.damageLevel,
        damageDescription: formData.notes,
        damageLocation: formData.garmentType,
        garmentType: formData.garmentType,
        pickupDate: formData.datetime,
        imageUrl: imageUrl || 'no-image',
        estimatedTime: getEstimatedTime(formData.damageLevel)
      };

      console.log('Repair data to send:', repairData);

      const result = await addRepairToCart(repairData);
      
      if (result.success) {
        setMessage(`✅ Repair service added to cart! Estimated price: ₱${estimatedPrice}${imageUrl ? ' (Image uploaded)' : ''}`);
        setTimeout(() => {
          onClose();
          if (onCartUpdate) onCartUpdate();
        }, 1500);
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Failed to add repair service');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const getEstimatedTime = (damageLevel) => {
    const times = {
      'minor': '2-3 days',
      'moderate': '3-5 days',
      'major': '5-7 days',
      'severe': '1-2 weeks'
    };
    return times[damageLevel] || '3-5 days';
  };

  const getEstimatedPickupDate = (damageLevel) => {
    const days = {
      'minor': 3,
      'moderate': 5,
      'major': 7,
      'severe': 14
    };
    
    const pickupDays = days[damageLevel] || 5;
    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + pickupDays);
    
    return pickupDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
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

          {/* Date & Time */}
          <div className="form-group">
            <label htmlFor="datetime">Preferred Date & Time *</label>
            <input
              type="datetime-local"
              id="datetime"
              name="datetime"
              value={formData.datetime}
              onChange={handleInputChange}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          {/* Price Estimate */}
          {estimatedPrice > 0 && (
            <div className="price-estimate">
              <h4>Estimated Price: ₱{estimatedPrice}</h4>
              <p>Based on damage level: {formData.damageLevel} • Garment type: {formData.garmentType}</p>
              <p className="estimated-time">⏱️ Estimated time: {getEstimatedTime(formData.damageLevel)}</p>
              <p className="estimated-pickup">📅 Estimated pickup: {getEstimatedPickupDate(formData.damageLevel)}</p>
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
