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

// Get all customization services
export async function getAllCustomizationServices() {
  try {
    const response = await axios.get(`${BASE_URL}/customization/services`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customization services error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization services",
      data: []
    };
  }
}

// Get customization service by ID
export async function getCustomizationServiceById(serviceId) {
  try {
    const response = await axios.get(`${BASE_URL}/customization/services/${serviceId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customization service error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization service",
      data: null
    };
  }
}

// Search customization services
export async function searchCustomizationServices(searchTerm) {
  try {
    const response = await axios.get(`${BASE_URL}/customization/search?term=${encodeURIComponent(searchTerm)}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Search customization services error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error searching customization services",
      data: []
    };
  }
}

// Upload customization image
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

// Get customization orders (admin only)
export async function getCustomizationOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/orders/customization/orders`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customization orders error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization orders",
      data: []
    };
  }
};

// Get customization orders by status (admin only)
export async function getCustomizationOrdersByStatus(status) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/customization/orders/status/${status}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customization orders by status error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customization orders by status",
      data: []
    };
  }
};

// Update customization order item (admin only)
export async function updateCustomizationOrderItem(itemId, updateData) {
  try {
    const response = await axios.put(`${BASE_URL}/orders/customization/items/${itemId}`, updateData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Update customization order item error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating customization order item"
    };
  }
};

// Add customization service to cart (using existing cart API)
export async function addCustomizationToCart(customizationData) {
  try {
    const cartItem = {
      serviceType: 'customization',
      serviceId: customizationData.serviceId || 1,
      quantity: 1,
      basePrice: customizationData.basePrice || '0',
      finalPrice: customizationData.estimatedPrice || '0',
      pricingFactors: {
        styleComplexity: customizationData.styleComplexity || 'basic',
        estimatedTime: customizationData.estimatedTime || '3-5 days',
        pickupDate: customizationData.pickupDate || ''
      },
      specificData: {
        serviceName: customizationData.serviceName || 'Customization Service',
        styleComplexity: customizationData.styleComplexity || 'basic',
        garmentType: customizationData.garmentType || customizationData.clothingType || '',
        customizationDetails: customizationData.customizationDetails || '',
        imageUrl: customizationData.imageUrl || 'no-image',
        pickupDate: customizationData.pickupDate || '',
        uploadedAt: new Date().toISOString(),
        // 2D customization data
        clothingType: customizationData.clothingType || '',
        variantId: customizationData.variantId || '',
        gender: customizationData.gender || 'unisex',
        fabricType: customizationData.fabricType || '',
        patternType: customizationData.patternType || '',
        colorValue: customizationData.colorValue || '#000000',
        clothingFit: customizationData.clothingFit || 'regular',
        aiImageUrl: customizationData.aiImageUrl || '',
        customizationPrompt: customizationData.customizationPrompt || ''
      }
    };

    // Import and use the existing addToCart function
    const { addToCart } = await import('./CartApi');
    return await addToCart(cartItem);
  } catch (error) {
    console.error("Add customization to cart error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error adding customization service to cart"
    };
  }
}