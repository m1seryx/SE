import React, { useState, useEffect } from 'react';
import { addDryCleaningToCart, uploadDryCleaningImage } from '../../api/DryCleaningApi';
import '../../styles/DryCleaningFormModal.css';

const DryCleaningFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  const [formData, setFormData] = useState({
    serviceName: '',
    brand: '',
    notes: '',
    datetime: '',
    quantity: 1
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [services, setServices] = useState([]);

  // Load dry cleaning services on mount
  useEffect(() => {
    if (isOpen) {
      loadDryCleaningServices();
    }
  }, [isOpen]);

  const loadDryCleaningServices = async () => {
    try {
      // Import dynamically to avoid circular dependency
      const { getDryCleaningServices } = await import('../../api/DryCleaningApi');
      const result = await getDryCleaningServices();
      if (result.success && result.data) {
        setServices(result.data);
      }
    } catch (error) {
      console.error('Error loading dry cleaning services:', error);
    }
  };

  // Calculate estimated price when quantity changes or services load
  useEffect(() => {
    if (formData.quantity) {
      calculatePrice();
    }
  }, [formData.quantity, services]);

  const calculatePrice = async () => {
    console.log('Calculating price for quantity:', formData.quantity);
    console.log('Available services:', services.length);
    
    if (!formData.quantity) {
      setEstimatedPrice(0);
      return;
    }

    setPriceLoading(true);
    try {
      // Use Basic Dry Cleaning as default service
      const defaultService = services.find(service => service.service_name === 'Basic Dry Cleaning') || services[0];
      console.log('Default service:', defaultService);
      
      if (defaultService) {
        const basePrice = parseFloat(defaultService.base_price) || 200;
        const pricePerItem = parseFloat(defaultService.price_per_item) || 150;
        const quantity = parseInt(formData.quantity);
        
        console.log('Price calculation:', { basePrice, pricePerItem, quantity });
        
        // Calculate total price: base price + (price per item * quantity)
        const totalPrice = basePrice + (pricePerItem * quantity);
        console.log('Calculated total price:', totalPrice);
        setEstimatedPrice(totalPrice);
      } else {
        // Fallback to default pricing if no services loaded
        const basePrice = 200;
        const pricePerItem = 150;
        const quantity = parseInt(formData.quantity);
        const totalPrice = basePrice + (pricePerItem * quantity);
        console.log('Using fallback pricing, total:', totalPrice);
        setEstimatedPrice(totalPrice);
      }
    } catch (error) {
      console.error('Price calculation error:', error);
      // Fallback to default pricing on error
      const basePrice = 200;
      const pricePerItem = 150;
      const quantity = parseInt(formData.quantity);
      const totalPrice = basePrice + (pricePerItem * quantity);
      console.log('Error fallback pricing, total:', totalPrice);
      setEstimatedPrice(totalPrice);
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
    
    if (!formData.brand || !formData.datetime) {
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
        
        const uploadResult = await uploadDryCleaningImage(imageFile);
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

      // Use a default service (Basic Dry Cleaning) since we're removing service selection
      const defaultService = services.find(service => service.service_name === 'Basic Dry Cleaning') || services[0];
      const fallbackBasePrice = 200;
      const fallbackPricePerItem = 150;
      const fallbackEstimatedTime = '2-3 days';
      
      const dryCleaningData = {
        serviceId: defaultService?.service_id || 1,
        serviceName: 'Basic Dry Cleaning',
        basePrice: (defaultService?.base_price || fallbackBasePrice.toString()),
        finalPrice: estimatedPrice.toString(),
        quantity: formData.quantity,
        brand: formData.brand,
        notes: formData.notes,
        pickupDate: formData.datetime,
        imageUrl: imageUrl || 'no-image',
        estimatedTime: defaultService?.estimated_time || fallbackEstimatedTime,
        pricePerItem: (defaultService?.price_per_item || fallbackPricePerItem.toString())
      };

      console.log('Dry cleaning data to send:', dryCleaningData);

      const result = await addDryCleaningToCart(dryCleaningData);
      
      if (result.success) {
        setMessage(`✅ Dry cleaning service added to cart! Estimated price: ₱${estimatedPrice}${imageUrl ? ' (Image uploaded)' : ''}`);
        setTimeout(() => {
          onClose();
          if (onCartUpdate) onCartUpdate();
        }, 1500);
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Failed to add dry cleaning service');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      brand: '',
      notes: '',
      datetime: '',
      quantity: 1
    });
    setImageFile(null);
    setImagePreview('');
    setEstimatedPrice(0);
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="drycleaning-form-modal-overlay">
      <div className="drycleaning-form-modal">
        <div className="drycleaning-form-header">
          <h2>Dry Cleaning Service</h2>
          <button className="drycleaning-form-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="drycleaning-form-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="brand">Clothing Brand *</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Gucci, Armani, Zara"
                required
              />
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label htmlFor="quantity">Number of Items *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                max="50"
                required
              />
              <small>Enter the number of items to be cleaned</small>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes">Special Instructions</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="e.g., Remove specific stains, handle with care, etc."
                rows="3"
              />
            </div>

            {/* Date & Time */}
            <div className="form-group">
              <label htmlFor="datetime">Preferred Pickup Date & Time *</label>
              <input
                type="datetime-local"
                id="datetime"
                name="datetime"
                value={formData.datetime}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label htmlFor="image">Upload Clothing Photo (Optional)</label>
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
                  <img src={imagePreview} alt="Clothing preview" className="preview-image" />
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
              <small>Photos help us provide better service and accurate pricing</small>
            </div>

            {/* Price Estimate */}
            {estimatedPrice > 0 && (
              <div className="price-estimate">
                <h4>Estimated Price</h4>
                <p>Base Price: ₱{services.find(s => s.service_name === 'Basic Dry Cleaning')?.base_price || '200'}</p>
                <p>Items: {formData.quantity} × ₱{services.find(s => s.service_name === 'Basic Dry Cleaning')?.price_per_item || '150'}</p>
                <p><strong>Total: ₱{estimatedPrice}</strong></p>
                <p className="estimated-time">Estimated Time: {services.find(s => s.service_name === 'Basic Dry Cleaning')?.estimated_time || '2-3 days'}</p>
                <p className="estimated-pickup">Pickup: {formData.datetime ? new Date(formData.datetime).toLocaleString() : 'Not set'}</p>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={loading || !formData.brand || !formData.datetime}
              >
                {loading ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DryCleaningFormModal;
