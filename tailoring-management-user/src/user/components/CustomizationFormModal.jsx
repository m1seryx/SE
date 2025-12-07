import React, { useState } from 'react';
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

  const garmentOptions = ['Blazer', 'Suits', 'Barong', 'Pants'];

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

    if (!formData.uploadedImage) {
      newErrors.image = 'Please upload a reference image';
    }
    if (!formData.fabricType.trim()) {
      newErrors.fabricType = 'Please enter fabric type';
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

      // Add to cart with backend API
      const cartResult = await addCustomizationToCart({
        fabricType: formData.fabricType,
        garmentType: formData.garmentType,
        preferredDate: formData.preferredDate,
        notes: formData.notes,
        imageUrl: imageUrl,
        estimatedPrice: 500, // Base price for customization
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

  // Handle 3D Customization - Open in new window
  const handleOpen3DCustomizer = () => {
    // Store form data in sessionStorage for 3D customizer (image is optional)
    sessionStorage.setItem('customizationFormData', JSON.stringify({
      fabricType: formData.fabricType,
      garmentType: formData.garmentType,
      preferredDate: formData.preferredDate,
      notes: formData.notes,
      imagePreview: imagePreview,
    }));

    // Open 3D customizer in new window/tab
    window.open('/3d-customizer', '_blank', 'width=1400,height=900');
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

          {/* 2. Fabric Type Input */}
          <div className="form-group">
            <label htmlFor="fabricType" className="form-label">
              🧵 Fabric Type
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fabricType"
              name="fabricType"
              value={formData.fabricType}
              onChange={handleInputChange}
              placeholder="e.g., Cotton, Silk, Wool, Linen"
              className={`form-input ${errors.fabricType ? 'error' : ''}`}
              disabled={loading}
            />
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
              {garmentOptions.map(option => (
                <option key={option} value={option}>
                  {option}
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

          {/* 5. Notes */}
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
