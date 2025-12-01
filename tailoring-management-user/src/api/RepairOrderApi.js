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

// Get all repair orders (admin only)
export async function getAllRepairOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/orders/repair/orders`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get repair orders error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching repair orders",
      orders: []
    };
  }
}

// Get repair orders by status (admin only)
export async function getRepairOrdersByStatus(status) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/repair/status/${status}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get repair orders by status error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching repair orders by status",
      orders: []
    };
  }
}

// Update repair order item (admin only)
export async function updateRepairOrderItem(itemId, updateData) {
  try {
    console.log("Making API call to update item:", itemId, updateData);
    const response = await axios.put(`${BASE_URL}/orders/repair/items/${itemId}`, updateData, {
      headers: getAuthHeaders()
    });
    console.log("API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Update repair order item error:", error);
    console.error("Error response:", error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating repair order item"
    };
  }
}
