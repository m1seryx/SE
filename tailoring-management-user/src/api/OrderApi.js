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

// Order API calls

// Get order item details by item ID
export async function getOrderItemDetails(orderItemId) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/items/${orderItemId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order item details:', error);
    throw error;
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
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

// Delete order item (admin only - only completed orders)
export async function deleteOrderItem(itemId) {
  try {
    const response = await axios.delete(`${BASE_URL}/orders/items/${itemId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting order item:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error deleting order item'
    };
  }
}
