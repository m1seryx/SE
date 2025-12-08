import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/CustomizationFormModal.css';
import { uploadCustomizationImage, addCustomizationToCart } from '../../api/CustomizationApi';

const CustomizationFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    uploadedImage: null,
    fabricType: '',
    garmentType: '',
    preferredDate: '',
    notes: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [designDetails, setDesignDetails] = useState(null);

  // Fabric types with prices
  const fabricTypes = {
    'Cotton': 200,
    'Silk': 300,
    'Linen': 400,
    'Wool': 200
  };

  // Garment types with prices
  const garmentTypes = {
    'Suits': 500,
    'Coat': 400,
    'barong': 400,
    'Pants': 200
  };

  // Preset colors from 3D customizer - must match exactly
  const presetColors = [
    { name: 'Classic Black', value: '#1a1a1a' },
    { name: 'Navy Blue', value: '#1e3a5f' },
    { name: 'Burgundy', value: '#6b1e3d' },
    { name: 'Forest Green', value: '#2d5a3d' },
    { name: 'Charcoal Gray', value: '#4a4a4a' },
    { name: 'Camel Tan', value: '#c9a66b' },
    { name: 'Cream White', value: '#f5e6d3' },
    { name: 'Chocolate Brown', value: '#5D4037' },
    { name: 'Royal Blue', value: '#2a4d8f' },
    { name: 'Wine Red', value: '#722F37' },
  ];

  // Helper function to convert hex color to color name - matches 3D customizer preset colors
  const getColorName = (hex) => {
    if (!hex) return 'Not specified';
    
    // Handle if it's already a string name
    if (typeof hex === 'string' && !hex.startsWith('#') && !hex.match(/^[0-9a-fA-F]{3,6}$/)) {
      return hex.charAt(0).toUpperCase() + hex.slice(1);
    }
    
    // Normalize hex (remove # if present, convert to lowercase)
    let normalizedHex = String(hex).toLowerCase().trim();
    if (!normalizedHex.startsWith('#')) {
      normalizedHex = `#${normalizedHex}`;
    }
    
    // First, check exact match with preset colors from 3D customizer
    const presetMatch = presetColors.find(color => color.value.toLowerCase() === normalizedHex);
    if (presetMatch) {
      return presetMatch.name;
    }
    
    // Additional common color mappings
    const additionalColorMap = {
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
    
    // Check additional color map
    if (additionalColorMap[normalizedHex]) {
      return additionalColorMap[normalizedHex];
    }
    
    // If it's a valid hex but not in map, find closest preset color
    if (normalizedHex.match(/^#[0-9a-f]{6}$/)) {
      // Extract RGB values
      const r = parseInt(normalizedHex.slice(1, 3), 16);
      const g = parseInt(normalizedHex.slice(3, 5), 16);
      const b = parseInt(normalizedHex.slice(5, 7), 16);
      
      // Find closest preset color by calculating color distance
      let closestColor = presetColors[0];
      let minDistance = Infinity;
      
      presetColors.forEach(preset => {
        const presetR = parseInt(preset.value.slice(1, 3), 16);
        const presetG = parseInt(preset.value.slice(3, 5), 16);
        const presetB = parseInt(preset.value.slice(5, 7), 16);
        
        // Calculate Euclidean distance in RGB space
        const distance = Math.sqrt(
          Math.pow(r - presetR, 2) + 
          Math.pow(g - presetG, 2) + 
          Math.pow(b - presetB, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestColor = preset;
        }
      });
      
      // If very close (within threshold), return the preset name
      if (minDistance < 30) {
        return closestColor.name;
      }
      
      // Otherwise, provide descriptive name based on RGB
      if (r > 200 && g > 200 && b > 200) return 'Light Color';
      if (r < 50 && g < 50 && b < 50) return 'Dark Color';
      if (r > g && r > b) return 'Reddish';
      if (g > r && g > b) return 'Greenish';
      if (b > r && b > g) return 'Bluish';
      if (r === g && g === b) return 'Gray';
      
      return 'Custom Color';
    }
    
    // Fallback: return a generic name
    return 'Custom Color';
  };

  // Helper function to get button type from model path
  const getButtonType = (modelPath) => {
    if (!modelPath) return '';
    const buttonMap = {
      '/orange button 3d model.glb': 'Orange Button',
      '/four hole button 3d model (1).glb': 'Four Hole Button',
    };
    return buttonMap[modelPath] || modelPath.split('/').pop().replace('.glb', '').replace(/\d+/g, '').trim();
  };

  // Helper function to get accessory name from model path
  const getAccessoryName = (modelPath) => {
    if (!modelPath) return '';
    const accessoryMap = {
      '/accessories/gold lion pendant 3d model.glb': 'Pendant',
      '/accessories/flower brooch 3d model.glb': 'Brooch',
      '/accessories/fabric rose 3d model.glb': 'Flower',
    };
    return accessoryMap[modelPath] || modelPath.split('/').pop().replace('.glb', '').replace(/\d+/g, '').trim();
  };

  // Load 3D customization data when modal opens
  useEffect(() => {
    if (isOpen) {
      const finalDesignData = sessionStorage.getItem('finalDesignData');
      if (finalDesignData) {
        try {
          const design = JSON.parse(finalDesignData);
          console.log('Loading 3D customization data:', design);
          
          // Get design image from design object
          // Check multiple possible locations for the image
          let designImage = design.design?.designImage || design.designImage || null;
          
          if (designImage) {
            // Handle base64 image (with or without data URL prefix)
            let imageData = designImage;
            if (designImage.startsWith('data:image')) {
              setImagePreview(designImage);
              imageData = designImage.split(',')[1];
            } else {
              // Assume it's base64 without prefix
              setImagePreview(`data:image/png;base64,${designImage}`);
            }
            
            // Convert base64 to blob for file upload
            try {
              const byteCharacters = atob(imageData);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/png' });
              const file = new File([blob], '3d-design.png', { type: 'image/png' });
              setFormData(prev => ({
                ...prev,
                uploadedImage: file
              }));
            } catch (err) {
              console.error('Error converting image:', err);
            }
          }
          
          // Prefill fabric and garment type
          if (design.design?.fabric) {
            // Map fabric names (3D customizer uses lowercase, dropdown uses capitalized)
            const fabricMap = {
              'wool': 'Wool',
              'cotton': 'Cotton',
              'silk': 'Silk',
              'linen': 'Linen'
            };
            const fabricName = fabricMap[design.design.fabric.toLowerCase()] || 
                              (design.design.fabric.charAt(0).toUpperCase() + design.design.fabric.slice(1));
            setFormData(prev => ({
              ...prev,
              fabricType: fabricName in fabricTypes ? fabricName : fabricName
            }));
          }
          
          if (design.design?.garmentType) {
            const garmentName = design.design.garmentType;
            // Map garment names to match our options
            let mappedGarment = garmentName;
            if (garmentName.includes('Suit') || garmentName.includes('suit')) {
              mappedGarment = 'Suits';
            } else if (garmentName.includes('Coat') || garmentName.includes('Blazer')) {
              mappedGarment = 'Coat';
            } else if (garmentName.includes('Barong') || garmentName.includes('barong')) {
              mappedGarment = 'barong';
            } else if (garmentName.includes('Pants') || garmentName.includes('Pants')) {
              mappedGarment = 'Pants';
            }
            
            setFormData(prev => ({
              ...prev,
              garmentType: mappedGarment
            }));
          }
          
          if (design.notes || design.design?.notes) {
            setFormData(prev => ({
              ...prev,
              notes: design.notes || design.design?.notes || ''
            }));
          }
          
          // Store design details for display
          if (design.design) {
            setDesignDetails(design.design);
          }
          
          // Clear the sessionStorage after loading
          sessionStorage.removeItem('finalDesignData');
        } catch (error) {
          console.error('Error loading 3D customization data:', error);
        }
      }
    }
  }, [isOpen]);

  // Calculate estimated price when fabric or garment changes
  useEffect(() => {
    if (formData.fabricType && formData.garmentType) {
      const fabricPrice = fabricTypes[formData.fabricType] || 0;
      const garmentPrice = garmentTypes[formData.garmentType] || 0;
      const total = fabricPrice + garmentPrice;
      setEstimatedPrice(total);
    } else {
      setEstimatedPrice(0);
    }
  }, [formData.fabricType, formData.garmentType]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please upload a valid image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          uploadedImage: file,
        }));
        setImagePreview(event.target.result);
        setErrors(prev => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.uploadedImage && !imagePreview) {
      newErrors.image = 'Please upload a reference image';
    }
    if (!formData.fabricType) {
      newErrors.fabricType = 'Please select a fabric type';
    }
    if (!formData.garmentType) {
      newErrors.garmentType = 'Please select a garment type';
    }
    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Please select a preferred date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let imageUrl = 'no-image';

      // Upload image to server if provided
      if (formData.uploadedImage) {
        const uploadResult = await uploadCustomizationImage(formData.uploadedImage);
        if (uploadResult.success) {
          imageUrl = uploadResult.imageUrl;
        } else {
          throw new Error(uploadResult.message || 'Failed to upload image');
        }
      }

      // Prepare designData without the base64 image (to avoid payload size issues)
      // The image is already uploaded separately and stored in imageUrl
      let cleanDesignData = null;
      if (designDetails) {
        // Create a deep copy and remove any base64 image data
        cleanDesignData = JSON.parse(JSON.stringify(designDetails));
        
        // Remove the base64 image from designData to reduce payload size
        // The image is already uploaded and we have the imageUrl
        if (cleanDesignData.designImage) {
          delete cleanDesignData.designImage;
        }
        // Also check nested design object if it exists
        if (cleanDesignData.design && cleanDesignData.design.designImage) {
          delete cleanDesignData.design.designImage;
        }
      }

      // Add to cart with backend API
      const cartResult = await addCustomizationToCart({
        fabricType: formData.fabricType,
        garmentType: formData.garmentType,
        preferredDate: formData.preferredDate,
        notes: formData.notes,
        imageUrl: imageUrl,
        estimatedPrice: estimatedPrice || 500,
        designData: cleanDesignData || {}, // Pass 3D design details without base64 image
      });

      if (cartResult.success) {
        // Show success message
        setMessage('Added to cart successfully!');
        
        // Call parent callback
        if (onCartUpdate) {
          onCartUpdate();
        }

        // Reset form and close modal after a short delay
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1000);
      } else {
        throw new Error(cartResult.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage(error.message || 'Failed to add to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 3D Customization - Navigate to 3D customizer page
  const handleOpen3DCustomizer = () => {
    // Store form data in sessionStorage for 3D customizer (image is optional)
    sessionStorage.setItem('customizationFormData', JSON.stringify({
      fabricType: formData.fabricType,
      garmentType: formData.garmentType,
      preferredDate: formData.preferredDate,
      notes: formData.notes,
      imagePreview: imagePreview,
    }));

    // Store flag to reopen modal when returning
    sessionStorage.setItem('reopenCustomizationModal', 'true');

    // Close modal and navigate to 3D customizer
    onClose();
    navigate('/3d-customizer');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      uploadedImage: null,
      fabricType: '',
      garmentType: '',
      preferredDate: '',
      notes: '',
    });
    setImagePreview('');
    setErrors({});
    setEstimatedPrice(0);
    setDesignDetails(null);
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="customization-form-modal-overlay" onClick={handleClose}>
      <div className="customization-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="customization-form-header">
          <h2>🧥 Customization Service</h2>
          <button className="customization-form-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="customization-form-content">
          {/* Message Display */}
          {message && (
            <div className={`message ${loading ? 'info' : 'success'}`}>
              {message}
            </div>
          )}

          {/* 1. Image Upload Section */}
          <div className="form-group">
            <label className="form-label">
              📷 Upload Reference Image
              <span className="required">*</span>
            </label>
            <div className="image-upload-wrapper">
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
                disabled={loading}
              />
              <label htmlFor="imageUpload" className="upload-button">
                {imagePreview ? '📷 Change Image' : '📁 Choose Image'}
              </label>
            </div>

            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      uploadedImage: null,
                    }));
                    setImagePreview('');
                  }}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            )}
            {errors.image && (
              <span className="error-message">{errors.image}</span>
            )}
          </div>

          {/* 2. Fabric Type Dropdown */}
          <div className="form-group">
            <label htmlFor="fabricType" className="form-label">
              🧵 Fabric Type
              <span className="required">*</span>
            </label>
            <select
              id="fabricType"
              name="fabricType"
              value={formData.fabricType}
              onChange={handleInputChange}
              className={`form-input ${errors.fabricType ? 'error' : ''}`}
              disabled={loading}
            >
              <option value="">-- Select Fabric Type --</option>
              {Object.keys(fabricTypes).map(fabric => (
                <option key={fabric} value={fabric}>
                  {fabric} - ₱{fabricTypes[fabric]}
                </option>
              ))}
            </select>
            {errors.fabricType && (
              <span className="error-message">{errors.fabricType}</span>
            )}
          </div>

          {/* 3. Garment Type Dropdown */}
          <div className="form-group">
            <label htmlFor="garmentType" className="form-label">
              👔 Garment Type
              <span className="required">*</span>
            </label>
            <select
              id="garmentType"
              name="garmentType"
              value={formData.garmentType}
              onChange={handleInputChange}
              className={`form-input ${errors.garmentType ? 'error' : ''}`}
              disabled={loading}
            >
              <option value="">-- Select Garment Type --</option>
              {Object.keys(garmentTypes).map(garment => (
                <option key={garment} value={garment}>
                  {garment} - ₱{garmentTypes[garment]}
                </option>
              ))}
            </select>
            {errors.garmentType && (
              <span className="error-message">{errors.garmentType}</span>
            )}
          </div>

          {/* 4. Preferred Date Picker */}
          <div className="form-group">
            <label htmlFor="preferredDate" className="form-label">
              📅 Preferred Date for Sizing in Store
              <span className="required">*</span>
            </label>
            <input
              type="date"
              id="preferredDate"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className={`form-input ${errors.preferredDate ? 'error' : ''}`}
              disabled={loading}
            />
            {errors.preferredDate && (
              <span className="error-message">{errors.preferredDate}</span>
            )}
          </div>

          {/* 5. 3D Customization Choices Display */}
          {designDetails && (
            <div className="form-group" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                🎨 3D Customization Choices
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
                {designDetails.size && (
                  <div>
                    <strong>Size:</strong> {designDetails.size.charAt(0).toUpperCase() + designDetails.size.slice(1)}
                  </div>
                )}
                {designDetails.fit && (
                  <div>
                    <strong>Fit:</strong> {designDetails.fit.charAt(0).toUpperCase() + designDetails.fit.slice(1)}
                  </div>
                )}
                {designDetails.colors && designDetails.colors.fabric && (
                  <div>
                    <strong>Color:</strong> {getColorName(designDetails.colors.fabric)}
                  </div>
                )}
                {designDetails.pattern && designDetails.pattern !== 'none' && (
                  <div>
                    <strong>Pattern:</strong> {designDetails.pattern.charAt(0).toUpperCase() + designDetails.pattern.slice(1)}
                  </div>
                )}
                {designDetails.personalization && designDetails.personalization.initials && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Personalization:</strong> {designDetails.personalization.initials} 
                    {designDetails.personalization.font && ` (${designDetails.personalization.font} font)`}
                  </div>
                )}
                {designDetails.buttons && designDetails.buttons.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Button Type:</strong>
                    <div style={{ marginLeft: '10px', marginTop: '5px', fontSize: '13px' }}>
                      {designDetails.buttons.map((btn, index) => (
                        <div key={btn.id || index}>
                          Button {index + 1}: {getButtonType(btn.modelPath)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {designDetails.accessories && designDetails.accessories.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Accessories:</strong>
                    <div style={{ marginLeft: '10px', marginTop: '5px', fontSize: '13px' }}>
                      {designDetails.accessories.map((acc, index) => (
                        <div key={acc.id || index}>
                          {getAccessoryName(acc.modelPath)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              📝 Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any special requests or notes..."
              rows="3"
              className="form-input textarea"
              disabled={loading}
            />
          </div>

          {/* 7. Estimated Price */}
          {estimatedPrice > 0 && formData.fabricType && formData.garmentType && (
            <div className="form-group" style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Estimated Price: ₱{estimatedPrice}</h4>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                Fabric: {formData.fabricType} (₱{fabricTypes[formData.fabricType]}) + 
                Garment: {formData.garmentType} (₱{garmentTypes[formData.garmentType]})
              </p>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                Note: Estimated price is based on the selected garment and fabric type. Final price may vary depending on sizes and other accessories.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer - Actions */}
        <div className="customization-form-actions">
          <button
            type="button"
            className="customization-form-btn customization-form-btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="customization-form-btn customization-form-btn-3d"
            onClick={handleOpen3DCustomizer}
            disabled={loading}
          >
            🎨 3D Customization
          </button>
          <button
            type="button"
            className="customization-form-btn customization-form-btn-primary"
            onClick={handleAddToCart}
            disabled={loading}
          >
            {loading ? 'Adding...' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationFormModal;
