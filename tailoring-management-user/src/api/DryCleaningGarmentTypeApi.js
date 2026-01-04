const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Get all active dry cleaning garment types
export const getAllDCGarmentTypes = async () => {
  try {
    const response = await fetch(`${API_URL}/api/dc-garment-types`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching DC garment types:', error);
    return { success: false, message: error.message };
  }
};

// Get all dry cleaning garment types (admin) - includes inactive
export const getAllDCGarmentTypesAdmin = async () => {
  try {
    const response = await fetch(`${API_URL}/api/dc-garment-types/admin/all`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching DC garment types (admin):', error);
    return { success: false, message: error.message };
  }
};

// Get single dry cleaning garment type by ID
export const getDCGarmentTypeById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/dc-garment-types/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching DC garment type:', error);
    return { success: false, message: error.message };
  }
};

// Create new dry cleaning garment type
export const createDCGarmentType = async (garmentData) => {
  try {
    const response = await fetch(`${API_URL}/api/dc-garment-types`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(garmentData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating DC garment type:', error);
    return { success: false, message: error.message };
  }
};

// Update dry cleaning garment type
export const updateDCGarmentType = async (id, garmentData) => {
  try {
    const response = await fetch(`${API_URL}/api/dc-garment-types/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(garmentData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating DC garment type:', error);
    return { success: false, message: error.message };
  }
};

// Delete dry cleaning garment type (hard delete)
export const deleteDCGarmentType = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/dc-garment-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting DC garment type:', error);
    return { success: false, message: error.message };
  }
};

// Deactivate dry cleaning garment type (soft delete)
export const deactivateDCGarmentType = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/dc-garment-types/${id}/deactivate`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deactivating DC garment type:', error);
    return { success: false, message: error.message };
  }
};

