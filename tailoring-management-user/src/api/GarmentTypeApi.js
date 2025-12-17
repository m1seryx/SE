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

// Get all active garment types (public)
export async function getAllGarmentTypes() {
  try {
    const response = await axios.get(`${BASE_URL}/garment-types`);
    return response.data;
  } catch (error) {
    console.error("Get garment types error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching garment types",
      garments: []
    };
  }
}

// Get all garment types including inactive (admin)
export async function getAllGarmentTypesAdmin() {
  try {
    const response = await axios.get(`${BASE_URL}/garment-types/admin`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get garment types (admin) error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching garment types",
      garments: []
    };
  }
}

// Create new garment type (admin)
export async function createGarmentType(garmentData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/garment-types`,
      garmentData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Create garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating garment type"
    };
  }
}

// Update garment type (admin)
export async function updateGarmentType(garmentId, garmentData) {
  try {
    const response = await axios.put(
      `${BASE_URL}/garment-types/${garmentId}`,
      garmentData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Update garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating garment type"
    };
  }
}

// Delete garment type (admin) - permanently deletes the record
export async function deleteGarmentType(garmentId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/garment-types/${garmentId}?permanent=true`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Delete garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting garment type"
    };
  }
}

