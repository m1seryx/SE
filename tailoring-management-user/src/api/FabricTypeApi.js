import axios from "axios";

// Dynamic API base URL - works in both web and React Native WebView
const getApiBase = () => {
  // Check if we're in React Native WebView and get API URL from injected data
  if (typeof window !== 'undefined' && window.REACT_NATIVE_AUTH?.apiBaseUrl) {
    return window.REACT_NATIVE_AUTH.apiBaseUrl;
  }
  
  // Check environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're on localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  
  // Auto-detect based on current hostname (for development)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Try to infer backend URL from current hostname
    // If web app is on 192.168.x.x:5174, backend is likely on 192.168.x.x:5000
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
  }
  
  // Fallback to localhost
  return 'http://localhost:5000/api';
};

const BASE_URL = getApiBase();

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Get all active fabric types (public)
export async function getAllFabricTypes() {
  try {
    const response = await axios.get(`${BASE_URL}/fabric-types`);
    return response.data;
  } catch (error) {
    console.error("Get fabric types error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching fabric types",
      fabrics: []
    };
  }
}

// Get all fabric types including inactive (admin)
export async function getAllFabricTypesAdmin() {
  try {
    const response = await axios.get(`${BASE_URL}/fabric-types/admin`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get fabric types (admin) error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching fabric types",
      fabrics: []
    };
  }
}

// Create new fabric type (admin)
export async function createFabricType(fabricData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/fabric-types`,
      fabricData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Create fabric type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating fabric type"
    };
  }
}

// Update fabric type (admin)
export async function updateFabricType(fabricId, fabricData) {
  try {
    const response = await axios.put(
      `${BASE_URL}/fabric-types/${fabricId}`,
      fabricData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Update fabric type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating fabric type"
    };
  }
}

// Delete fabric type (admin)
export async function deleteFabricType(fabricId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/fabric-types/${fabricId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Delete fabric type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting fabric type"
    };
  }
}

