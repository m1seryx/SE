// PostRent.jsx
import React, { useState } from 'react';
import '../adminStyle/post.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

const PostRent = () => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    price: '',
    color: '',
    fabric: '',
    length: '',
    desc: '',
    status: 'Available',
  });

  const openModal = (id = null) => {
    if (id != null) {
      const item = items.find(i => i.id === id);
      if (item) {
        setFormData({
          name: item.name,
          size: item.size || '',
          price: item.price || '',
          color: item.color || '',
          fabric: item.fabric || '',
          length: item.length || '',
          desc: item.desc || '',
          status: item.status,
        });
        setImagePreview(item.image);
        setEditingId(id);
      }
    } else {
      setFormData({
        name: '', size: '', price: '', color: '', fabric: '', length: '', desc: '', status: 'Available'
      });
      setImagePreview('');
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImagePreview('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveItem = () => {
    if (!imagePreview && !editingId) {
      alert('Please upload an image!');
      return;
    }

    const newItem = {
      id: editingId || Date.now(),
      image: imagePreview || items.find(i => i.id === editingId)?.image || '',
      name: formData.name || 'Unnamed Item',
      size: formData.size,
      price: formData.price,
      color: formData.color,
      fabric: formData.fabric,
      length: formData.length,
      desc: formData.desc,
      status: formData.status,
    };

    if (editingId) {
      setItems(prev => prev.map(item => item.id === editingId ? newItem : item));
    } else {
      setItems(prev => [...prev, newItem]);
    }

    closeModal();
    alert(editingId ? 'Item updated!' : 'Item posted successfully!');
  };

  const deleteItem = (id) => {
    if (window.confirm('Delete this item permanently?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
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

        <div className="filter-container">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Items</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
          </select>
        </div>

        <div className="items-grid">
          {filteredItems.length === 0 ? (
            <p className="empty-message">
              No items found. Click "Add Post +" to start!
            </p>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="item-card">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p><strong>Size:</strong> {item.size || 'N/A'}</p>
                  <p><strong>Fabric:</strong> {item.fabric || 'N/A'}</p>
                  <p><strong>Color:</strong> {item.color || 'N/A'}</p>
                  <div className="item-price">₱{item.price || '0'}/3day</div>
                  <span className={`status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                  <div className="action-buttons">
                    <button className="edit-btn" onClick={() => openModal(item.id)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => deleteItem(item.id)}>
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
                  <label>Item Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Size</label>
                  <input type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Price</label>
                  <input type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Color</label>
                  <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Fabric Type</label>
                  <input type="text" value={formData.fabric} onChange={(e) => setFormData({ ...formData, fabric: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Length</label>
                  <input type="text" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="Rented">Rented</option>
                </select>
              </div>

              <div className="input-group">
                <label>Description (Optional)</label>
                <textarea rows={3} value={formData.desc} onChange={(e) => setFormData({ ...formData, desc: e.target.value })} />
              </div>
            </div>

            <div className="dialog-footer">
              <button className="submit-btn" onClick={saveItem}>
                {editingId ? 'Update Item' : 'Post Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
};

export default PostRent;