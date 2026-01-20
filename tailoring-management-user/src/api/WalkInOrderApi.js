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

// Create walk-in dry cleaning order
export async function createWalkInDryCleaningOrder(orderData) {
  try {
    const response = await axios.post(`${BASE_URL}/walk-in-orders/dry-cleaning`, orderData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Create walk-in dry cleaning order error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating walk-in dry cleaning order"
    };
  }
}

// Create walk-in repair order
export async function createWalkInRepairOrder(orderData) {
  try {
    const response = await axios.post(`${BASE_URL}/walk-in-orders/repair`, orderData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Create walk-in repair order error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating walk-in repair order"
    };
  }
}

// Create walk-in customization order
export async function createWalkInCustomizationOrder(orderData) {
  try {
    const response = await axios.post(`${BASE_URL}/walk-in-orders/customization`, orderData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Create walk-in customization order error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating walk-in customization order"
    };
  }
}

// Create walk-in rental order
export async function createWalkInRentalOrder(orderData) {
  try {
    const response = await axios.post(`${BASE_URL}/walk-in-orders/rental`, orderData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Create walk-in rental order error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating walk-in rental order"
    };
  }
}

// Get all walk-in orders
export async function getAllWalkInOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/walk-in-orders`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get all walk-in orders error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching walk-in orders",
      orders: []
    };
  }
}

// Get walk-in order by ID
export async function getWalkInOrderById(orderId) {
  try {
    const response = await axios.get(`${BASE_URL}/walk-in-orders/${orderId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get walk-in order by ID error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching walk-in order"
    };
  }
}

// Search walk-in customers
export async function searchWalkInCustomers(searchTerm) {
  try {
    const response = await axios.get(`${BASE_URL}/walk-in-orders/customers/search`, {
      params: { search: searchTerm },
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Search walk-in customers error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error searching customers",
      customers: []
    };
  }
}

