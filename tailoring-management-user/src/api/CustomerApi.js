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

// Get all customers
export async function getAllCustomers() {
  try {
    const response = await axios.get(`${BASE_URL}/customers`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customers error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customers",
      customers: []
    };
  }
}

// Get customer by ID
export async function getCustomerById(customerId) {
  try {
    const response = await axios.get(`${BASE_URL}/customers/${customerId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get customer error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching customer"
    };
  }
}

// Update customer
export async function updateCustomer(customerId, customerData) {
  try {
    const response = await axios.put(`${BASE_URL}/customers/${customerId}`, customerData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Update customer error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating customer"
    };
  }
}

// Update customer status
export async function updateCustomerStatus(customerId, status) {
  try {
    const response = await axios.patch(`${BASE_URL}/customers/${customerId}/status`, { status }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Update customer status error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating customer status"
    };
  }
}

// Save customer measurements
export async function saveMeasurements(customerId, measurements) {
  try {
    const response = await axios.post(`${BASE_URL}/customers/${customerId}/measurements`, measurements, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Save measurements error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error saving measurements"
    };
  }
}

// Get customer measurements
export async function getMeasurements(customerId) {
  try {
    const response = await axios.get(`${BASE_URL}/customers/${customerId}/measurements`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get measurements error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching measurements"
    };
  }
}

