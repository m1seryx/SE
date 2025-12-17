import React, { useState, useEffect } from 'react';
import { addDryCleaningToCart, uploadDryCleaningImage } from '../../api/DryCleaningApi';
import { getAvailableSlots, bookSlot } from '../../api/AppointmentSlotApi';
import { getAllGarmentTypes } from '../../api/GarmentTypeApi';
import '../../styles/DryCleaningFormModal.css';
import '../../styles/SharedModal.css';

const DryCleaningFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  // Garment types - will be loaded from API
  const [garmentTypes, setGarmentTypes] = useState({});
  const [garmentTypesList, setGarmentTypesList] = useState([]);

  const [formData, setFormData] = useState({
    serviceName: '',
    brand: '',
    notes: '',
    date: '',
    time: '',
    quantity: 1,
    garmentType: '',
    customGarmentType: ''
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isEstimatedPrice, setIsEstimatedPrice] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [services, setServices] = useState([]);

  // Load garment types on mount
  useEffect(() => {
    loadGarmentTypes();
  }, []);

  // Load garment types from API
  const loadGarmentTypes = async () => {
    try {
      const result = await getAllGarmentTypes();
      if (result.success && result.garments) {
        // Create object for quick price lookup
        const typesObj = {};
        result.garments.forEach(garment => {
          if (garment.is_active === 1) {
            typesObj[garment.garment_name.toLowerCase()] = parseFloat(garment.garment_price);
          }
        });
        setGarmentTypes(typesObj);
        setGarmentTypesList(result.garments.filter(g => g.is_active === 1));
      }
    } catch (err) {
      console.error("Load garment types error:", err);
      // Fallback to default values if API fails
      setGarmentTypes({
        'barong': 200,
        'suits': 200,
        'coat': 300,
        'trousers': 200
      });
    }
  };

  // Load dry cleaning services on mount
  useEffect(() => {
    if (isOpen) {
      loadDryCleaningServices();
      // Reset form when modal opens
      setFormData({
        serviceName: '',
        brand: '',
        notes: '',
        date: '',
        time: '',
        quantity: 1,
        garmentType: '',
        customGarmentType: ''
      });
      setAvailableTimeSlots([]);
    }
  }, [isOpen]);

  // Load available time slots when date changes
  useEffect(() => {
    if (formData.date) {
      loadAvailableSlots(formData.date);
    } else {
      setAvailableTimeSlots([]);
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [formData.date]);

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
      const result = await getAvailableSlots('dry_cleaning', date);
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

  // Calculate price when quantity or garment type changes
  useEffect(() => {
    if (formData.quantity && formData.garmentType) {
      calculatePrice();
    } else {
      setEstimatedPrice(0);
      setIsEstimatedPrice(false);
    }
  }, [formData.quantity, formData.garmentType, formData.customGarmentType, garmentTypesList]);

  const calculatePrice = () => {
    if (!formData.quantity || !formData.garmentType) {
      setEstimatedPrice(0);
      setIsEstimatedPrice(false);
      return;
    }

    const quantity = parseInt(formData.quantity);
    
    if (formData.garmentType === 'others') {
      // For "others", use estimated price: quantity × 350
      const estimatedPricePerItem = 350;
      const totalPrice = estimatedPricePerItem * quantity;
      setEstimatedPrice(totalPrice);
      setIsEstimatedPrice(true);
    } else {
      // For dropdown choices, use final price: quantity × garment price
      // Find the garment type from the list
      const selectedGarment = garmentTypesList.find(g => g.garment_name.toLowerCase() === formData.garmentType);
      const pricePerItem = selectedGarment ? parseFloat(selectedGarment.garment_price) : (garmentTypes[formData.garmentType] || 200);
      const totalPrice = pricePerItem * quantity;
      setEstimatedPrice(totalPrice);
      setIsEstimatedPrice(false);
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

    if (!formData.brand || !formData.date || !formData.time || !formData.garmentType) {
      setMessage('Please fill in all required fields including date and time');
      return;
    }

    if (formData.garmentType === 'others' && !formData.customGarmentType.trim()) {
      setMessage('Please specify the garment type');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // First, book the appointment slot
      let slotResult = null;
      try {
        slotResult = await bookSlot('dry_cleaning', formData.date, formData.time);
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
      const defaultService = services && services.length > 0 
        ? (services.find(service => service.service_name === 'Basic Dry Cleaning') || services[0])
        : null;
      
      // Determine the actual garment type to store
      const actualGarmentType = formData.garmentType === 'others' 
        ? formData.customGarmentType.trim() 
        : formData.garmentType;
      
      // Get price per item based on garment type
      let pricePerItem = 350; // Default for "others"
      if (formData.garmentType !== 'others') {
        const selectedGarment = garmentTypesList.find(g => g.garment_name.toLowerCase() === formData.garmentType);
        pricePerItem = selectedGarment ? parseFloat(selectedGarment.garment_price) : (garmentTypes[formData.garmentType] || 200);
      }

      // Combine date and time for pickupDate
      const pickupDateTime = `${formData.date}T${formData.time}`;

      const dryCleaningData = {
        serviceId: defaultService?.service_id || 1,
        serviceName: 'Basic Dry Cleaning',
        basePrice: '0', // No base price, price depends only on quantity and garment type
        finalPrice: estimatedPrice.toString(),
        quantity: formData.quantity,
        brand: formData.brand,
        notes: formData.notes,
        pickupDate: pickupDateTime,
        imageUrl: imageUrl || 'no-image',
        pricePerItem: pricePerItem.toString(),
        garmentType: actualGarmentType,
        isEstimatedPrice: isEstimatedPrice
      };

      console.log('Dry cleaning data to send:', dryCleaningData);
      console.log('Estimated price:', estimatedPrice);
      console.log('Form data:', formData);

      const result = await addDryCleaningToCart(dryCleaningData);
      console.log('Add to cart result:', result);
      console.log('Result success:', result?.success);
      console.log('Result message:', result?.message);

      if (result && result.success) {
        // Slot is already booked and will be linked to cart item in the backend
        const priceLabel = isEstimatedPrice ? 'Estimated price' : 'Final price';
        setMessage(`✅ Dry cleaning service added to cart! ${priceLabel}: ₱${estimatedPrice}${imageUrl ? ' (Image uploaded)' : ''}`);
        setTimeout(() => {
          onClose();
          if (onCartUpdate) onCartUpdate();
        }, 1500);
      } else {
        // If cart addition fails, we should cancel the booked slot
        // But for now, the slot will remain booked - user can try again or admin can manage
        console.error('Cart addition failed:', result);
        const errorMessage = result?.message || result?.error || 'Failed to add to cart. Please check console for details.';
        setMessage(`❌ Error: ${errorMessage}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error details:', error.response?.data);
      setMessage(`❌ Failed to add dry cleaning service: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      serviceName: '',
      brand: '',
      notes: '',
      date: '',
      time: '',
      quantity: 1,
      garmentType: '',
      customGarmentType: ''
    });
    setImageFile(null);
    setImagePreview('');
    setEstimatedPrice(0);
    setIsEstimatedPrice(false);
    setMessage('');
    setAvailableTimeSlots([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-shared" onClick={handleClose}>
      <div className="modal-container-shared" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-shared">
          <h2 className="modal-title-shared">🧼 Dry Cleaning Service</h2>
          <button className="modal-close-shared" onClick={handleClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="modal-content-shared">
          <form onSubmit={handleSubmit}>
            {/* Garment Type */}
            <div className="form-group-shared">
              <label htmlFor="garmentType" className="form-label-shared">
                Garment Type <span className="required-indicator">*</span>
              </label>
              <select
                id="garmentType"
                name="garmentType"
                value={formData.garmentType}
                onChange={handleInputChange}
                className="form-select-shared"
                required
              >
                <option value="">Select garment type...</option>
                {garmentTypesList.map(garment => (
                  <option key={garment.garment_id} value={garment.garment_name.toLowerCase()}>
                    {garment.garment_name} - ₱{parseFloat(garment.garment_price).toFixed(2)}
                  </option>
                ))}
                <option value="others">Others</option>
              </select>
              {formData.garmentType === 'others' && (
                <input
                  type="text"
                  name="customGarmentType"
                  value={formData.customGarmentType}
                  onChange={handleInputChange}
                  placeholder="Specify garment type..."
                  className="form-input-shared"
                  style={{ marginTop: '12px' }}
                  required
                />
              )}
            </div>

            <div className="form-group-shared">
              <label htmlFor="brand" className="form-label-shared">
                Clothing Brand <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Gucci, Armani, Zara"
                className="form-input-shared"
                required
              />
            </div>

            {/* Quantity */}
            <div className="form-group-shared">
              <label htmlFor="quantity" className="form-label-shared">
                Number of Items <span className="required-indicator">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                max="50"
                className="form-input-shared"
                required
              />
              <span className="help-text-shared">Enter the number of items to be cleaned</span>
            </div>

            {/* Notes */}
            <div className="form-group-shared">
              <label htmlFor="notes" className="form-label-shared">Special Instructions</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="e.g., Remove specific stains, handle with care, etc."
                rows="3"
                className="form-textarea-shared"
              />
            </div>

            {/* Date & Time */}
            <div className="form-group-shared">
              <label htmlFor="date" className="form-label-shared">
                Drop off item date <span className="required-indicator">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleDateChange}
                min={getMinDate()}
                className="form-input-shared"
                required
              />
              <span className="help-text-shared">Available Monday to Saturday only</span>
            </div>

            {formData.date && (
              <div className="form-group-shared">
                <label htmlFor="time" className="form-label-shared">
                  Available Time Slots <span className="required-indicator">*</span>
                </label>
                {loadingSlots ? (
                  <div className="help-text-shared">Loading available time slots...</div>
                ) : availableTimeSlots.length > 0 ? (
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="form-select-shared"
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
                  <div className="error-message-shared">
                    No available time slots for this date. Please select another date.
                  </div>
                )}
              </div>
            )}

            {/* Image Upload */}
            <div className="form-group-shared">
              <label htmlFor="image" className="form-label-shared">Upload Clothing Photo (Optional)</label>
              <div className="image-upload-wrapper-shared">
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input-shared"
                />
                <label htmlFor="image" className="upload-button-shared">
                  📷 Choose Photo
                </label>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview-shared">
                  <img src={imagePreview} alt="Clothing preview" />
                  <button
                    type="button"
                    className="remove-image-btn-shared"
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
                <div className="help-text-shared" style={{ marginTop: '8px' }}>
                  📎 {imageFile.name}
                </div>
              )}
              <span className="help-text-shared">Photos help us provide better service and accurate pricing</span>
            </div>

            {/* Price Estimate */}
            {estimatedPrice > 0 && formData.garmentType && (
              <div className="price-estimate-shared">
                <h4>{isEstimatedPrice ? 'Estimated Price' : 'Final Price'}</h4>
                {formData.garmentType === 'others' ? (
                  <>
                    <p>Items: {formData.quantity} × ₱350 (estimated)</p>
                    <p><strong>Total: ₱{estimatedPrice} (Estimated)</strong></p>
                  </>
                ) : (
                  <>
                    <p>Garment: {formData.garmentType.charAt(0).toUpperCase() + formData.garmentType.slice(1)}</p>
                    <p>Items: {formData.quantity} × ₱{garmentTypes[formData.garmentType]}</p>
                    <p><strong>Total: ₱{estimatedPrice}</strong></p>
                  </>
                )}
                <p className="estimated-pickup">Drop off item date: {formData.date && formData.time ? `${formData.date} ${formData.time.substring(0, 5)}` : 'Not set'}</p>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`message-shared ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {/* Form Actions */}
            <div className="modal-footer-shared">
              <button
                type="button"
                className="btn-shared btn-cancel-shared"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-shared btn-primary-shared"
                disabled={loading || !formData.brand || !formData.date || !formData.time || !formData.garmentType || (formData.garmentType === 'others' && !formData.customGarmentType.trim())}
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
