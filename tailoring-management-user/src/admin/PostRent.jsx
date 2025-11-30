// PostRent.jsx
import React, { useState, useEffect } from 'react';
import '../adminStyle/post.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllRentals, createRental, updateRental, deleteRental, getRentalImageUrl } from '../api/RentalApi';

const PostRent = () => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    brand: '',
    size: '',
    color: '',
    category: 'suit',
    base_rental_fee: '',
    daily_rate: '',
    deposit_amount: '',
    total_available: '1',
    material: '',
    care_instructions: '',
    status: 'available'
  });

  // Load rental items from API on component mount
  useEffect(() => {
    loadRentalItems();
  }, []);

  const loadRentalItems = async () => {
    try {
      const result = await getAllRentals();
      if (result.items) {
        setItems(result.items);
      }
    } catch (error) {
      console.error('Error loading rental items:', error);
      setError('Error loading rental items');
    }
  };

  const openModal = (id = null) => {
    setError('');
    if (id != null) {
      const item = items.find(i => i.item_id === id);
      if (item) {
        setFormData({
          item_name: item.item_name || '',
          description: item.description || '',
          brand: item.brand || '',
          size: item.size || '',
          color: item.color || '',
          category: item.category || 'suit',
          base_rental_fee: item.base_rental_fee || '',
          daily_rate: item.daily_rate || '',
          deposit_amount: item.deposit_amount || '',
          total_available: item.total_available?.toString() || '1',
          material: item.material || '',
          care_instructions: item.care_instructions || '',
          status: item.status || 'available'
        });
        setImagePreview(item.image_url ? getRentalImageUrl(item.image_url) : '');
        setEditingId(id);
      }
    } else {
      setFormData({
        item_name: '',
        description: '',
        brand: '',
        size: '',
        color: '',
        category: 'suit',
        base_rental_fee: '',
        daily_rate: '',
        deposit_amount: '',
        total_available: '1',
        material: '',
        care_instructions: '',
        status: 'available'
      });
      setImagePreview('');
      setImageFile(null);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImagePreview('');
    setImageFile(null);
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const saveItem = async () => {
    setError('');
    setIsLoading(true);

    // Validation
    if (!formData.item_name || !formData.base_rental_fee || !formData.daily_rate) {
      setError('Item name, base rental fee, and daily rate are required');
      setIsLoading(false);
      return;
    }

    try {
      let result;
      
      if (editingId) {
        // Update existing item
        result = await updateRental(editingId, formData, imageFile);
      } else {
        // Create new item
        result = await createRental(formData, imageFile);
      }

      if (result.success !== false) {
        // Reload items from server
        await loadRentalItems();
        closeModal();
        alert(editingId ? 'Item updated successfully!' : 'Item posted successfully!');
      } else {
        setError(result.message || 'Error saving item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      setError('Error saving item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Delete this item permanently?')) {
      try {
        const result = await deleteRental(id);
        if (result.success !== false) {
          setItems(prev => prev.filter(item => item.item_id !== id));
          alert('Item deleted successfully!');
        } else {
          setError(result.message || 'Error deleting item');
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        setError('Error deleting item. Please try again.');
      }
    }
  };

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  const filteredItems = filter ? items.filter(i => i.status === filter) : items;

  return (
    <div className="postrent">
      <Sidebar />
      <AdminHeader />

      <div className="content">
        <div className="dashboard-title">
          <h2>Post Rental Items</h2>
          <p>Manage and showcase available items for rent</p>
          <button className="add-btn" onClick={() => openModal()}>Add Post +</button>
        </div>

        {error && (
          <div className="error-message" style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        <div className="filter-container">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Items</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="items-grid">
          {filteredItems.length === 0 ? (
            <p className="empty-message">
              No items found. Click "Add Post +" to start!
            </p>
          ) : (
            filteredItems.map(item => (
              <div key={item.item_id} className="compact-item-card" onClick={() => openDetailModal(item)}>
                <img 
                  src={item.image_url ? getRentalImageUrl(item.image_url) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='} 
                  alt={item.item_name} 
                  className="compact-item-image" 
                />
                <div className="compact-item-info">
                  <h3>{item.item_name}</h3>
                  <div className="compact-item-price">
                    ₱{item.base_rental_fee || '0'} / day
                  </div>
                  <span className={`status-badge ${item.status?.toLowerCase()}`}>
                    {item.status || 'available'}
                  </span>
                  <div className="compact-actions">
                    <button className="compact-edit-btn" onClick={(e) => { e.stopPropagation(); openModal(item.item_id); }}>
                      Edit
                    </button>
                    <button className="compact-delete-btn" onClick={(e) => { e.stopPropagation(); deleteItem(item.item_id); }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="overlay" onClick={(e) => {
          if (e.target.classList.contains('overlay')) {
            closeModal();
          }
        }}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>{editingId ? 'Edit Item' : 'Add New Item'}</h3>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>

            <div className="dialog-body">
              {error && (
                <div className="error-message" style={{ 
                  backgroundColor: '#f8d7da', 
                  color: '#721c24', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  marginBottom: '15px' 
                }}>
                  {error}
                </div>
              )}

              <div className="upload-area" onClick={() => document.getElementById('imageInput')?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p><strong>Click to upload image</strong></p>
                    <small>JPG, PNG up to 5MB</small>
                  </div>
                )}
                <input type="file" id="imageInput" accept="image/*" className="hidden-input" onChange={handleImageChange} />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Item Name *</label>
                  <input 
                    type="text" 
                    value={formData.item_name} 
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} 
                    placeholder="e.g., Brown Business Suit"
                  />
                </div>
                <div className="input-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="suit">Suit</option>
                    <option value="tuxedo">Tuxedo</option>
                    <option value="formal_wear">Formal Wear</option>
                    <option value="business">Business</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Base Rental Fee *</label>
                  <input 
                    type="text" 
                    value={formData.base_rental_fee} 
                    onChange={(e) => setFormData({ ...formData, base_rental_fee: e.target.value })} 
                    placeholder="e.g., 100.00"
                  />
                </div>
                <div className="input-group">
                  <label>Daily Rate *</label>
                  <input 
                    type="text" 
                    value={formData.daily_rate} 
                    onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })} 
                    placeholder="e.g., 30.00"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Deposit Amount</label>
                  <input 
                    type="text" 
                    value={formData.deposit_amount} 
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })} 
                    placeholder="e.g., 200.00"
                  />
                </div>
                <div className="input-group">
                  <label>Total Available</label>
                  <input 
                    type="number" 
                    value={formData.total_available} 
                    onChange={(e) => setFormData({ ...formData, total_available: e.target.value })} 
                    min="1"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Brand</label>
                  <input 
                    type="text" 
                    value={formData.brand} 
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                    placeholder="e.g., Armani"
                  />
                </div>
                <div className="input-group">
                  <label>Size</label>
                  <input 
                    type="text" 
                    value={formData.size} 
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })} 
                    placeholder="e.g., L, 42"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Color</label>
                  <input 
                    type="text" 
                    value={formData.color} 
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                    placeholder="e.g., Brown"
                  />
                </div>
                <div className="input-group">
                  <label>Material</label>
                  <input 
                    type="text" 
                    value={formData.material} 
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })} 
                    placeholder="e.g., Wool"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Describe the rental item..."
                />
              </div>

              <div className="input-group">
                <label>Care Instructions</label>
                <textarea 
                  rows={2} 
                  value={formData.care_instructions} 
                  onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })} 
                  placeholder="Special care instructions..."
                />
              </div>
            </div>

            <div className="dialog-footer">
              <button className="submit-btn" onClick={saveItem} disabled={isLoading}>
                {isLoading ? (editingId ? 'Updating...' : 'Posting...') : (editingId ? 'Update Item' : 'Post Item')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="overlay" onClick={closeDetailModal}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3>{selectedItem.item_name}</h3>
              <button className="close-button" onClick={closeDetailModal}>×</button>
            </div> 
            
            <div className="detail-modal-body">
              <div className="detail-image-section">
                <img 
                  src={selectedItem.image_url ? getRentalImageUrl(selectedItem.image_url) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='} 
                  alt={selectedItem.item_name} 
                  className="detail-image"
                />
        </div>
        
        <div className="detail-info-section">
          <div className="detail-status">
            <span className={`status-badge ${selectedItem.status?.toLowerCase()}`}>
              {selectedItem.status || 'available'}
            </span>
          </div>
          
          <div className="detail-grid">
            <div className="detail-item">
              <label>Category:</label>
              <span>{selectedItem.category || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Brand:</label>
              <span>{selectedItem.brand || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Size:</label>
              <span>{selectedItem.size || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Color:</label>
              <span>{selectedItem.color || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Material:</label>
              <span>{selectedItem.material || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Available:</label>
              <span>{selectedItem.total_available || '0'}</span>
            </div>
          </div>
          
          <div className="detail-pricing">
            <h4>Pricing</h4>
            <div className="price-grid">
              <div className="price-item">
                <label>Base Fee:</label>
                <span className="price-value">₱{selectedItem.base_rental_fee || '0'}</span>
              </div>
              <div className="price-item">
                <label>Daily Rate:</label>
                <span className="price-value">₱{selectedItem.daily_rate || '0'}</span>
              </div>
              <div className="price-item">
                <label>Deposit:</label>
                <span className="price-value">₱{selectedItem.deposit_amount || '0'}</span>
              </div>
            </div>
          </div>
          
          {selectedItem.description && (
            <div className="detail-description">
              <h4>Description</h4>
              <p>{selectedItem.description}</p>
            </div>
          )}
          
          {selectedItem.care_instructions && (
            <div className="detail-care">
              <h4>Care Instructions</h4>
              <p>{selectedItem.care_instructions}</p>
            </div>
          )}
          
          <div className="detail-actions">
            <button className="detail-edit-btn" onClick={() => { closeDetailModal(); openModal(selectedItem.item_id); }}>
              Edit Item
            </button>
            <button className="detail-delete-btn" onClick={() => { closeDetailModal(); deleteItem(selectedItem.item_id); }}>
              Delete Item
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
</div>
); 
};

export default PostRent;