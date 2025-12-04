import axios from "axios";
import { getToken } from "./AuthApi";

const BASE_URL = "http://localhost:5000/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Cart API calls

// Get user's cart
export async function getUserCart() {
  try {
    const response = await axios.get(`${BASE_URL}/cart`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get user cart error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching cart",
      items: []
    };
  }
}

// Add item to cart (updated for database structure)
export async function addToCart(itemData) {
  try {
    const response = await axios.post(`${BASE_URL}/cart`, itemData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Add to cart error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error adding item to cart"
    };
  }
}

// Update cart item
export async function updateCartItem(itemId, updateData) {
  try {
    const response = await axios.put(`${BASE_URL}/cart/${itemId}`, updateData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Update cart item error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating cart item"
    };
  }
}

// Remove item from cart
export async function removeFromCart(itemId) {
  try {
    const response = await axios.delete(`${BASE_URL}/cart/${itemId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Remove from cart error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error removing item from cart"
    };
  }
}

// Clear entire cart
export async function clearCart() {
  try {
    const response = await axios.delete(`${BASE_URL}/cart`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Clear cart error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error clearing cart"
    };
  }
}

// Submit cart as order
export async function submitCart(notes = '', appointmentDate = '') {
  try {
    const response = await axios.post(`${BASE_URL}/cart/submit`, { notes, appointmentDate }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Submit cart error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error submitting cart"
    };
  }
}

// Get user's orders
export async function getUserOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/orders`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get orders error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching orders",
      orders: []
    };
  }
}

// Upload file for cart item (e.g., repair images)
export async function uploadCartItemFile(file, itemId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('itemId', itemId);

    const response = await axios.post(`${BASE_URL}/cart/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Upload cart file error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error uploading file"
    };
  }
}

// Get cart total/count
export async function getCartSummary() {
  try {
    const response = await axios.get(`${BASE_URL}/cart/summary`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get cart summary error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching cart summary",
      itemCount: 0,
      totalAmount: 0
    };
  }
}