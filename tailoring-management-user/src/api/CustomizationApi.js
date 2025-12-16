import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Upload customization image (design preview from 3D customizer)
export async function uploadCustomizationImage(file) {
  try {
    const formData = new FormData();
    formData.append('customizationImage', file);

    const response = await axios.post(`${BASE_URL}/customization/upload-image`, formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Upload customization image error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error uploading customization image"
    };
  }
}

// Get user's customization orders
export async function getUserCustomizationOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/customization/user`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get user customization orders error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization orders",
      orders: []
    };
  }
}

// Get all customization orders (admin)
export async function getAllCustomizationOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/customization`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get all customization orders error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization orders",
      orders: []
    };
  }
}

// Get customization stats (admin)
export async function getCustomizationStats() {
  try {
    const response = await axios.get(`${BASE_URL}/customization/stats`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customization stats error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization stats",
      stats: {}
    };
  }
}

// Get single customization order
export async function getCustomizationOrderById(itemId) {
  try {
    const response = await axios.get(`${BASE_URL}/customization/${itemId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customization order error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization order",
      order: null
    };
  }
}

// Update customization order (admin)
export async function updateCustomizationOrderItem(itemId, updateData) {
  try {
    const response = await axios.put(`${BASE_URL}/customization/${itemId}`, updateData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Update customization order error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating customization order"
    };
  }
}

// Update approval status only (admin quick action)
export async function updateCustomizationApprovalStatus(itemId, status) {
  try {
    const response = await axios.put(`${BASE_URL}/customization/${itemId}/status`, { status }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Update customization status error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating customization status"
    };
  }
}

// Add customization to cart (using existing cart API)
export async function addCustomizationToCart(customizationData) {
  try {
    const cartItem = {
      serviceType: 'customization',
      serviceId: null, // Backend will generate incremental ID
      quantity: 1,
      basePrice: customizationData.estimatedPrice || 500,
      finalPrice: customizationData.estimatedPrice || 500,
      pricingFactors: {
        fabricType: customizationData.fabricType,
        garmentType: customizationData.garmentType,
        designComplexity: customizationData.designComplexity || 'standard',
        preferredDate: customizationData.preferredDate
      },
      specificData: {
        garmentType: customizationData.garmentType,
        fabricType: customizationData.fabricType,
        measurements: customizationData.measurements,
        notes: customizationData.notes,
        preferredDate: customizationData.preferredDate,
        imageUrl: customizationData.imageUrl || 'no-image',
        designData: customizationData.designData || {}, // 3D design configuration
        uploadedAt: new Date().toISOString()
      }
    };

    // Import and use the existing addToCart function
    const { addToCart } = await import('./CartApi');
    return await addToCart(cartItem);
  } catch (error) {
    console.error("Add customization to cart error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error adding customization to cart"
    };
  }
}

// Upload GLB file (admin)
export async function uploadGLBFile(file, modelData) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return {
        success: false,
        message: 'Authentication required. Please log in again.'
      };
    }

    console.log('Uploading GLB file:', {
      fileName: file.name,
      fileSize: file.size,
      modelName: modelData.model_name,
      hasToken: !!token
    });

    const formData = new FormData();
    formData.append('glbFile', file);
    formData.append('model_name', modelData.model_name);
    formData.append('model_type', modelData.model_type || 'garment');
    if (modelData.garment_category) formData.append('garment_category', modelData.garment_category);
    if (modelData.description) formData.append('description', modelData.description);

    const response = await axios.post(`${BASE_URL}/customization/upload-glb`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - axios will set it automatically with boundary for FormData
      },
      // Increase timeout for large files
      timeout: 60000 // 60 seconds
    });
    return response.data;
  } catch (error) {
    console.error("Upload GLB file error:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Authentication failed. Please log in again.',
        requiresAuth: true
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Error uploading GLB file"
    };
  }
}

// Get all custom 3D models
export async function getAllCustom3DModels() {
  try {
    const response = await axios.get(`${BASE_URL}/customization/custom-models`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get custom 3D models error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching custom 3D models",
      models: []
    };
  }
}

// Get custom 3D models by type
export async function getCustom3DModelsByType(type) {
  try {
    const response = await axios.get(`${BASE_URL}/customization/custom-models/type/${type}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get custom 3D models by type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching custom 3D models",
      models: []
    };
  }
}

// Delete custom 3D model
export async function deleteCustom3DModel(modelId) {
  try {
    const response = await axios.delete(`${BASE_URL}/customization/custom-models/${modelId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Delete custom 3D model error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting custom 3D model"
    };
  }
}