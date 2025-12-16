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

