import React, { useState, useEffect } from 'react';
import { addCustomizationToCart, uploadCustomizationImage, getAllCustomizationServices } from '../../api/CustomizationApi';
import Customization2DWrapper from '../pages/Customization2D';
import '../../styles/RepairFormModal.css'; // We can reuse the same styles


const styles = `
  .form-section {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    background-color: #f9f9f9;
  }
  
  .form-section h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 10px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #555;
  }
  
  .form-group select, 
  .form-group input, 
  .form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .form-group textarea {
    min-height: 80px;
    resize: vertical;
  }
`;


if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const CustomizationFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  const [formData, setFormData] = useState({
    serviceId: '',
    serviceName: '',
    styleComplexity: '',
    datetime: '',
   
    clothingType: '',
    variantId: '',
    gender: 'unisex',
    fabricType: '',
    patternType: '',
    colorValue: '#000000',
    clothingFit: 'regular'
  });
  const [show2DCustomization, setShow2DCustomization] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [services, setServices] = useState([]);

  // Fetch available customization services
  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const result = await getAllCustomizationServices();
      if (Array.isArray(result)) {
        setServices(result);
        // Set default service if available
        if (result.length > 0) {
          setFormData(prev => ({
            ...prev,
            serviceId: String(result[0].service_id) || '',
            serviceName: result[0].service_name || 'Customization Service'
          }));
        } else {
          // Set a default service if no services exist
          setFormData(prev => ({
            ...prev,
            serviceId: 'default-customization',
            serviceName: 'Customization Service'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // Set a default service if there's an error
      setFormData(prev => ({
        ...prev,
        serviceId: 'default-customization',
        serviceName: 'Customization Service'
      }));
    }
  };




  // Style complexities with base prices
  const styleComplexities = [
    { value: 'basic', label: 'Basic', basePrice: 300, description: 'Simple alterations, hems, minor adjustments' },
    { value: 'intermediate', label: 'Intermediate', basePrice: 500, description: 'Medium complexity designs, pattern adjustments' },
    { value: 'advanced', label: 'Advanced', basePrice: 800, description: 'Complex custom designs, major pattern work' },
    { value: 'premium', label: 'Premium', basePrice: 1500, description: 'High-end custom creations, intricate detailing' }
  ];

  // Calculate estimated price when style complexity changes
  useEffect(() => {
    if (formData.styleComplexity) {
      calculateEstimatedPrice();
    }
  }, [formData.styleComplexity]);

  const calculateEstimatedPrice = async () => {
    if (!formData.styleComplexity) {
      setEstimatedPrice(0);
      return;
    }

    setPriceLoading(true);
    
    try {
      // Get base price from style complexity
      const complexity = styleComplexities.find(level => level.value === formData.styleComplexity);
      let basePrice = complexity ? complexity.basePrice : 500;

      const finalPrice = Math.round(basePrice);
      setEstimatedPrice(finalPrice);
    } catch (error) {
      console.error('Price calculation error:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate color input
    if (name === 'colorValue') {
      // If it's a hex color input, ensure it's valid
      if (value === '' || (value.match(/^#[0-9A-F]{0,6}$/i))) {
        setFormData(prev => ({
          ...prev,
          [name]: value || '#000000'
        }));
        return;
      }
    }
    
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

  // Redirect to 2D customization tool
  const redirectTo2DCustomization = () => {
    // Show the integrated 2D customization tool
    setShow2DCustomization(true);
  };
  
  // Handle confirmation from 2D customization tool
  const handle2DCustomizationConfirm = (customizationData) => {
    // Map the 2D customization data to our form data
    setFormData(prev => ({
      ...prev,
      serviceName: `${customizationData.clothingType} Custom Design`,
      // Map 2D customization fields
      clothingType: customizationData.clothingType,
      variantId: customizationData.variantId,
      gender: customizationData.gender,
      fabricType: customizationData.fabricType,
      patternType: customizationData.patternType,
      colorValue: customizationData.colorValue,
      clothingFit: customizationData.clothingFit,
      // We'll need to add date selection after returning from 2D tool
    }));
    
    // Hide the 2D customization tool
    setShow2DCustomization(false);
    
    // Show a message to the user
    setMessage('2D customization completed! Please select a date and confirm your order.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.serviceId || (typeof formData.serviceId === 'string' && formData.serviceId.trim() === '') || !formData.styleComplexity || !formData.datetime) {
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
        
        const uploadResult = await uploadCustomizationImage(imageFile);
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

      const customizationData = {
        serviceId: formData.serviceId,
        basePrice: estimatedPrice.toString(),
        estimatedPrice: estimatedPrice.toString(),
        styleComplexity: formData.styleComplexity,
        pickupDate: formData.datetime,
        imageUrl: imageUrl || 'no-image',
        estimatedTime: getEstimatedTime(formData.styleComplexity),
        // 2D customization data
        clothingType: formData.clothingType,
        variantId: formData.variantId,
        gender: formData.gender,
        fabricType: formData.fabricType,
        patternType: formData.patternType,
        colorValue: formData.colorValue,
        clothingFit: formData.clothingFit
      };
      
      // Set service name
      customizationData.serviceName = formData.serviceName || 'Customization Service';

      console.log('Customization data to send:', customizationData);

      const result = await addCustomizationToCart(customizationData);
      
      if (result.success) {
        setMessage(`✅ Customization service added to cart! Estimated price: ₱${estimatedPrice}${imageUrl ? ' (Image uploaded)' : ''}`);
        setTimeout(() => {
          onClose();
          if (onCartUpdate) onCartUpdate();
        }, 1500);
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Failed to add customization service');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const getEstimatedTime = (styleComplexity) => {
    const times = {
      'basic': '2-3 days',
      'intermediate': '3-5 days',
      'advanced': '5-7 days',
      'premium': '1-2 weeks'
    };
    return times[styleComplexity] || '3-5 days';
  };

  const getEstimatedPickupDate = (styleComplexity) => {
    const days = {
      'basic': 3,
      'intermediate': 5,
      'advanced': 7,
      'premium': 14
    };
    
    const pickupDays = days[styleComplexity] || 5;
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
      serviceId: '',
      serviceName: '',
      styleComplexity: '',
      datetime: '',
      // Reset 2D customization fields
      clothingType: '',
      variantId: '',
      gender: 'unisex',
      fabricType: '',
      patternType: '',
      colorValue: '#000000',
      clothingFit: 'regular'
    });
    setImageFile(null);
    setMessage('');
    setEstimatedPrice(0);
    onClose();
  };

  if (!isOpen) return null;

  // Show 2D customization tool if requested
  if (show2DCustomization) {
    return (
      <div className="repair-form-modal-overlay">
        <div className="repair-form-modal" style={{width: '95%', maxWidth: '1200px', height: '90vh', padding: 0}}>
          <Customization2DWrapper 
            onClose={() => setShow2DCustomization(false)}
            onConfirmOrder={handle2DCustomizationConfirm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="repair-form-modal-overlay" onClick={handleClose}>
      <div className="repair-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="repair-form-header">
          <h2>Customization</h2>
          <button className="repair-form-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="repair-form-content">
          {/* Style Complexity */}
          <div className="form-group">
            <label htmlFor="styleComplexity">Style Complexity *</label>
            <select
              id="styleComplexity"
              name="styleComplexity"
              value={formData.styleComplexity}
              onChange={handleInputChange}
              required
            >
              <option value="">Select style complexity</option>
              {styleComplexities.map(complexity => (
                <option key={complexity.value} value={complexity.value}>
                  {complexity.label} - {complexity.description}
                </option>
              ))}
            </select>
          </div>

          {/* 2D Customization Fields */}
          <div className="form-section">
            <h3>Design Specifications</h3>
            
            {/* Clothing Type */}
            <div className="form-group">
              <label htmlFor="clothingType">Clothing Type:</label>
              <select
                id="clothingType"
                name="clothingType"
                value={formData.clothingType}
                onChange={handleInputChange}
              >
                <option value="">Select clothing type</option>
                <option value="coat">Coat</option>
                <option value="barong">Barong</option>
                <option value="suit">Suit</option>
                <option value="pants">Pants</option>
              </select>
            </div>

            {/* Variant */}
            <div className="form-group">
              <label htmlFor="variantId">Variant:</label>
              <select
                id="variantId"
                name="variantId"
                value={formData.variantId}
                onChange={handleInputChange}
              >
                <option value="">Select variant</option>
                {/* Coats */}
                {formData.clothingType === 'coat' && (
                  <>
                    <option value="coat_trench">Modern Trench Coat</option>
                    <option value="coat_cocoon">Cocoon Coat</option>
                    <option value="coat_overcoat">Double-Breasted Overcoat</option>
                  </>
                )}
                {/* Barong */}
                {formData.clothingType === 'barong' && (
                  <option value="barong_classic">Classic Piña Barong</option>
                )}
                {/* Suits */}
                {formData.clothingType === 'suit' && (
                  <>
                    <option value="suit_classic">Classic Two-Piece</option>
                    <option value="suit_double">Double-Breasted Suit</option>
                    <option value="suit_tux">Evening Tuxedo</option>
                  </>
                )}
                {/* Pants */}
                {formData.clothingType === 'pants' && (
                  <>
                    <option value="pants_formal">Formal Trousers</option>
                    <option value="pants_wide">Wide-Leg Trousers</option>
                  </>
                )}
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter any additional description for your design..."
                rows={2}
              />
            </div>

            {/* Color */}
            <div className="form-group">
              <label htmlFor="colorValue">Color:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  id="colorValue"
                  name="colorValue"
                  value={formData.colorValue}
                  onChange={handleInputChange}
                  style={{ width: '50px', height: '40px', border: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={formData.colorValue}
                  onChange={handleInputChange}
                  name="colorValue"
                  placeholder="#000000"
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            {/* Fabric */}
            <div className="form-group">
              <label htmlFor="fabricType">Fabric:</label>
              <select
                id="fabricType"
                name="fabricType"
                value={formData.fabricType}
                onChange={handleInputChange}
              >
                <option value="">Select fabric</option>
                <option value="cotton">Cotton Twill</option>
                <option value="silk">Silk Blend</option>
                <option value="denim">Selvedge Denim</option>
                <option value="linen">Irish Linen</option>
                <option value="wool">Wool Cashmere</option>
                <option value="piña">Piña Fiber</option>
                <option value="jusi">Jusi Silk</option>
                <option value="organza">Organza</option>
              </select>
            </div>

            {/* Pattern */}
            <div className="form-group">
              <label htmlFor="patternType">Pattern:</label>
              <select
                id="patternType"
                name="patternType"
                value={formData.patternType}
                onChange={handleInputChange}
              >
                <option value="">Select pattern</option>
                <option value="solid">Solid</option>
                <option value="stripes">Stripes</option>
                <option value="checked">Checked</option>
                <option value="floral">Floral</option>
              </select>
            </div>

            {/* Gender */}
            <div className="form-group">
              <label htmlFor="gender">Gender:</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            {/* Fit */}
            <div className="form-group">
              <label htmlFor="clothingFit">Fit:</label>
              <select
                id="clothingFit"
                name="clothingFit"
                value={formData.clothingFit}
                onChange={handleInputChange}
              >
                <option value="regular">Regular</option>
                <option value="slim">Slim</option>
                <option value="loose">Loose</option>
              </select>
            </div>
          </div>

          {/* 2D Customization Tool Button */}
          <div className="form-group">
            <label>Advanced Customization</label>
            <button 
              type="button" 
              className="btn-submit" 
              onClick={redirectTo2DCustomization}
              style={{ width: '100%', backgroundColor: '#6A3C3E', borderColor: '#6A3C3E' }}
            >
              🎨 Use Advanced 2D Customization Tool
            </button>
            <small>Design your garment visually with our advanced 2D customization tool</small>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image">Upload Reference Image (Optional)</label>
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
                <img src={imagePreview} alt="Customization preview" className="preview-image" />
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
            <small>Reference images help us understand your vision better</small>
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
              <p>Based on style complexity: {formData.styleComplexity}</p>
              <p className="estimated-time">⏱️ Estimated time: {getEstimatedTime(formData.styleComplexity)}</p>
              <p className="estimated-pickup">📅 Estimated pickup: {getEstimatedPickupDate(formData.styleComplexity)}</p>
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

export default CustomizationFormModal;