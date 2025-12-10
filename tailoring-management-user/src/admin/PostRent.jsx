// PostRent.jsx
import React, { useState, useEffect } from 'react';
import '../adminStyle/post.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getAllRentals, createRental, updateRental, deleteRental, getRentalImageUrl } from '../api/RentalApi';
import { useAlert } from '../context/AlertContext';

const PostRent = () => {
  const { alert, confirm } = useAlert();
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
    price: '',
    downpayment: '',
    total_available: '1',
    material: '',
    care_instructions: '',
    status: 'available',
    measurements: {
      // Top measurements
      chest: '',
      shoulders: '',
      sleeveLength: '',
      neck: '',
      waist: '',
      length: '',
      // Bottom measurements
      hips: '',
      inseam: '',
      thigh: '',
      outseam: ''
    }
  });

  // Load rental items from API on component mount
  useEffect(() => {
    loadRentalItems();
  }, []);

  const loadRentalItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await getAllRentals();
      console.log('Rental items API response:', result); // Debug log
      if (result.items && Array.isArray(result.items) && result.items.length > 0) {
        setItems(result.items);
        console.log('Loaded rental items:', result.items.length); // Debug log
      } else if (result && Array.isArray(result) && result.length > 0) {
        // Handle case where API returns array directly
        setItems(result);
        console.log('Loaded rental items (array):', result.length); // Debug log
      } else {
        console.log('No rental items found in database. Admin should add items via "Add Post +" button.');
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading rental items:', error);
      setError('Error loading rental items: ' + (error.message || 'Unknown error'));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (id = null) => {
    setError('');
    if (id != null) {
      const item = items.find(i => i.item_id === id);
      if (item) {
        // Parse measurements if stored as JSON string
        let measurements = {
          chest: '', shoulders: '', sleeveLength: '', neck: '', waist: '', length: '',
          hips: '', inseam: '', thigh: '', outseam: ''
        };
        if (item.size) {
          try {
            const parsed = typeof item.size === 'string' ? JSON.parse(item.size) : item.size;
            if (parsed && typeof parsed === 'object') {
              measurements = { ...measurements, ...parsed };
            }
          } catch (e) {
            // If not JSON, keep as is (backward compatibility)
          }
        }

        setFormData({
          item_name: item.item_name || '',
          description: item.description || '',
          brand: item.brand || '',
          size: item.size || '',
          color: item.color || '',
          category: item.category || 'suit',
          price: item.price || '',
          downpayment: item.downpayment || '',
          total_available: item.total_available?.toString() || '1',
          material: item.material || '',
          care_instructions: item.care_instructions || '',
          status: item.status || 'available',
          measurements: measurements
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
        price: '',
        downpayment: '',
        total_available: '1',
        material: '',
        care_instructions: '',
        status: 'available',
        measurements: {
          chest: '', shoulders: '', sleeveLength: '', neck: '', waist: '', length: '',
          hips: '', inseam: '', thigh: '', outseam: ''
        }
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

  // Determine if category uses top or bottom measurements
  const isTopCategory = (category) => {
    return ['suit', 'tuxedo', 'formal_wear', 'business'].includes(category);
  };

  const isBottomCategory = (category) => {
    return ['casual', 'pants', 'trousers'].includes(category);
  };

  const handleMeasurementChange = (field, value) => {
    setFormData({
      ...formData,
      measurements: {
        ...formData.measurements,
        [field]: value
      }
    });
  };

  const saveItem = async () => {
    setError('');
    setIsLoading(true);

    // Validation
    if (!formData.item_name || !formData.price) {
      setError('Item name and price are required');
      setIsLoading(false);
      return;
    }

    // Prepare form data with measurements as JSON string in size field
    const measurementsToSave = {};
    if (isTopCategory(formData.category)) {
      measurementsToSave.chest = formData.measurements.chest || '';
      measurementsToSave.shoulders = formData.measurements.shoulders || '';
      measurementsToSave.sleeveLength = formData.measurements.sleeveLength || '';
      measurementsToSave.neck = formData.measurements.neck || '';
      measurementsToSave.waist = formData.measurements.waist || '';
      measurementsToSave.length = formData.measurements.length || '';
    } else if (isBottomCategory(formData.category)) {
      measurementsToSave.waist = formData.measurements.waist || '';
      measurementsToSave.hips = formData.measurements.hips || '';
      measurementsToSave.inseam = formData.measurements.inseam || '';
      measurementsToSave.length = formData.measurements.length || '';
      measurementsToSave.thigh = formData.measurements.thigh || '';
      measurementsToSave.outseam = formData.measurements.outseam || '';
    }

    const dataToSave = {
      ...formData,
      size: JSON.stringify(measurementsToSave)
    };

    try {
      let result;
      
      if (editingId) {
        // Update existing item
        result = await updateRental(editingId, dataToSave, imageFile);
      } else {
        // Create new item
        result = await createRental(dataToSave, imageFile);
      }

      if (result.success !== false) {
        // Reload items from server
        await loadRentalItems();
        closeModal();
        await alert(editingId ? 'Item updated successfully!' : 'Item posted successfully!', 'Success', 'success');
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
    const confirmed = await confirm('Delete this item permanently?', 'Delete Item', 'warning');
    if (confirmed) {
      try {
        const result = await deleteRental(id);
        if (result.success !== false) {
          setItems(prev => prev.filter(item => item.item_id !== id));
          await alert('Item deleted successfully!', 'Success', 'success');
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

  // Filter items by status - handle null/undefined status values
  const filteredItems = filter 
    ? items.filter(i => (i.status || 'available') === filter) 
    : items;

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
          {isLoading ? (
            <p className="empty-message">Loading rental items...</p>
          ) : filteredItems.length === 0 ? (
            <p className="empty-message">
              {items.length === 0 
                ? 'No rental items found in database. Click "Add Post +" to add your first rental item!' 
                : `No items found with status "${filter || 'all'}". ${items.length} total item(s) in database.`}
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
                    ₱{item.price || '0'}
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
                    <option value="pants">Pants</option>
                    <option value="trousers">Trousers</option>
                  </select>
                </div>
              </div>

              {/* Measurements Section - Dynamic based on category */}
              {isTopCategory(formData.category) && (
                <div className="measurements-section" style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>Top Measurements</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Measurement</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Value (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Chest (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.chest} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, chest: e.target.value }
                            })} 
                            placeholder="Enter chest measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Shoulders (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.shoulders} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, shoulders: e.target.value }
                            })} 
                            placeholder="Enter shoulder measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Sleeve Length (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.sleeveLength} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, sleeveLength: e.target.value }
                            })} 
                            placeholder="Enter sleeve length"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Neck (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.neck} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, neck: e.target.value }
                            })} 
                            placeholder="Enter neck measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Waist (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.waist} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, waist: e.target.value }
                            })} 
                            placeholder="Enter waist measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', color: '#000' }}><strong style={{ color: '#000' }}>Length (inches)</strong></td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.length} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, length: e.target.value }
                            })} 
                            placeholder="Enter length measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {isBottomCategory(formData.category) && (
                <div className="measurements-section" style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>Bottom Measurements</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Measurement</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#333' }}>Value (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Waist (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.waist} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, waist: e.target.value }
                            })} 
                            placeholder="Enter waist measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Hips (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.hips} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, hips: e.target.value }
                            })} 
                            placeholder="Enter hip measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Inseam (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.inseam} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, inseam: e.target.value }
                            })} 
                            placeholder="Enter inseam measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Length (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.length} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, length: e.target.value }
                            })} 
                            placeholder="Enter length measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', color: '#000' }}><strong style={{ color: '#000' }}>Thigh (inches)</strong></td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.thigh} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, thigh: e.target.value }
                            })} 
                            placeholder="Enter thigh measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', color: '#000' }}><strong style={{ color: '#000' }}>Outseam (inches)</strong></td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            step="0.5"
                            value={formData.measurements.outseam} 
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              measurements: { ...formData.measurements, outseam: e.target.value }
                            })} 
                            placeholder="Enter outseam measurement"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', color: '#000' }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-grid">
                <div className="input-group">
                  <label>Price *</label>
                  <input 
                    type="text" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    placeholder="e.g., 500.00"
                  />
                </div>
                <div className="input-group">
                  <label>Downpayment Amount</label>
                  <input 
                    type="text" 
                    value={formData.downpayment} 
                    onChange={(e) => setFormData({ ...formData, downpayment: e.target.value })} 
                    placeholder="e.g., 200.00"
                  />
                </div>
              </div>

              <div className="form-grid">
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
                    <label>Measurements:</label>
                    <div style={{ marginTop: '8px' }}>
                      {(() => {
                        let measurements = {};
                        try {
                          measurements = typeof selectedItem.size === 'string' ? JSON.parse(selectedItem.size || '{}') : (selectedItem.size || {});
                        } catch (e) {
                          // If not JSON, show as plain text
                          return <span>{selectedItem.size || 'N/A'}</span>;
                        }
                        
                        if (isTopCategory(selectedItem.category)) {
                          return (
                            <div>
                              <strong>Top Measurements:</strong>
                              <div style={{ marginLeft: '15px', marginTop: '5px' }}>
                                {measurements.chest && <div>Chest: {measurements.chest}"</div>}
                                {measurements.shoulders && <div>Shoulders: {measurements.shoulders}"</div>}
                                {measurements.sleeveLength && <div>Sleeve Length: {measurements.sleeveLength}"</div>}
                                {measurements.neck && <div>Neck: {measurements.neck}"</div>}
                                {measurements.waist && <div>Waist: {measurements.waist}"</div>}
                                {measurements.length && <div>Length: {measurements.length}"</div>}
                              </div>
                            </div>
                          );
                        } else if (isBottomCategory(selectedItem.category)) {
                          return (
                            <div>
                              <strong>Bottom Measurements:</strong>
                              <div style={{ marginLeft: '15px', marginTop: '5px' }}>
                                {measurements.waist && <div>Waist: {measurements.waist}"</div>}
                                {measurements.hips && <div>Hips: {measurements.hips}"</div>}
                                {measurements.inseam && <div>Inseam: {measurements.inseam}"</div>}
                                {measurements.length && <div>Length: {measurements.length}"</div>}
                                {measurements.thigh && <div>Thigh: {measurements.thigh}"</div>}
                                {measurements.outseam && <div>Outseam: {measurements.outseam}"</div>}
                              </div>
                            </div>
                          );
                        } else {
                          return <span>{selectedItem.size || 'N/A'}</span>;
                        }
                      })()}
                    </div>
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
                      <label>Price:</label>
                      <span className="price-value">₱{selectedItem.price || '0'}</span>
                    </div>
                    <div className="price-item">
                      <label>Downpayment:</label>
                      <span className="price-value">₱{selectedItem.downpayment || '0'}</span>
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