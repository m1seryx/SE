import React, { useState, useEffect } from 'react';
import '../adminStyle/inventory.css';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import { getCompletedItems, getItemsByServiceType, getInventoryStats } from '../api/InventoryApi';

const Inventory = () => {
  const [allItems, setAllItems] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({
    total: 0,
    customization: 0,
    dryCleaning: 0,
    repair: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Fetch inventory data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventory items
        const itemsResponse = await getCompletedItems();
        if (itemsResponse.success) {
          setAllItems(itemsResponse.items);
        }

        // Fetch inventory statistics
        const statsResponse = await getInventoryStats();
        if (statsResponse.success) {
          setInventoryStats(statsResponse.stats);
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter items based on search term and service filter
  const filteredItems = allItems.filter(item => {
    const matchesSearch = 
      item.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = serviceFilter ? item.serviceType === serviceFilter : true;
    
    return matchesSearch && matchesService;
  });

  // Handle service filter change
  const handleServiceFilterChange = async (e) => {
    const serviceType = e.target.value;
    setServiceFilter(serviceType);
    
    if (serviceType === '') {
      // If no filter, fetch all items
      setLoading(true);
      const response = await getCompletedItems();
      if (response.success) {
        setAllItems(response.items);
      }
      setLoading(false);
    } else {
      // Fetch items for specific service type
      setLoading(true);
      const response = await getItemsByServiceType(serviceType);
      if (response.success) {
        setAllItems(response.items);
      }
      setLoading(false);
    }
  };

  // Get service type color
  const getServiceTypeColor = (serviceType) => {
    const colors = {
      'Customization': '#9c27b0', // Purple
      'Dry Cleaning': '#2196f3',   // Blue
      'Repair': '#ff9800',        // Orange
      'Rental': '#4caf50',        // Green
      'Alteration': '#f44336',    // Red
      'Consultation': '#795548',  // Brown
      'Other': '#607d8b'          // Blue Grey
    };
    return colors[serviceType] || '#666';
  };

  return (
    <div className="inventory-management">
      <Sidebar />
      <AdminHeader />
      
      <div className="content">
        <div className="dashboard-title">
          <div>
            <h2>Inventory Management</h2>
            <p>Track completed service items</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span>Total Items</span>
              <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2196f3' }}>📦</div>
            </div>
            <div className="stat-number">{inventoryStats.total}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Customization</span>
              <div className="stat-icon" style={{ background: '#f3e5f5', color: '#9c27b0' }}>✂️</div>
            </div>
            <div className="stat-number">{inventoryStats.customization}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Dry Cleaning</span>
              <div className="stat-icon" style={{ background: '#e3f2fd', color: '#2196f3' }}>🧺</div>
            </div>
            <div className="stat-number">{inventoryStats.dryCleaning}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Repair</span>
              <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>🔧</div>
            </div>
            <div className="stat-number">{inventoryStats.repair}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Total Value</span>
              <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>💰</div>
            </div>
            <div className="stat-number" style={{ fontSize: '24px' }}>
              ₱{inventoryStats.totalValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Unique No. or Customer Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select value={serviceFilter} onChange={handleServiceFilterChange}>
            <option value="">All Services</option>
            <option value="Customization">Customization</option>
            <option value="Dry Cleaning">Dry Cleaning</option>
            <option value="Repair">Repair</option>
            <option value="Alteration">Alteration</option>
            <option value="Consultation">Consultation</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              Loading inventory items...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Unique No.</th>
                  <th>Customer Name</th>
                  <th>Service Type</th>
                  <th>Date Completed</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.uniqueNo}</strong></td>
                      <td>{item.customerName}</td>
                      <td>
                        <span className="service-type-badge" data-service-type={item.serviceType}>
                          {item.serviceType}
                        </span>
                      </td>
                      <td>{item.date}</td>
                      <td style={{ fontWeight: '600', color: '#2e7d32' }}>
                        ₱{item.price.toLocaleString()}
                      </td>
                      <td>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32'
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;