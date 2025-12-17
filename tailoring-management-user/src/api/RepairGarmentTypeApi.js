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

// Get all active repair garment types (public)
export async function getAllRepairGarmentTypes() {
  try {
    const response = await axios.get(`${BASE_URL}/repair-garment-types`);
    return response.data;
  } catch (error) {
    console.error("Get repair garment types error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching repair garment types",
      garments: []
    };
  }
}

// Get all repair garment types including inactive (admin)
export async function getAllRepairGarmentTypesAdmin() {
  try {
    const response = await axios.get(`${BASE_URL}/repair-garment-types/admin`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get repair garment types (admin) error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching repair garment types",
      garments: []
    };
  }
}

// Create new repair garment type (admin)
export async function createRepairGarmentType(garmentData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/repair-garment-types`,
      garmentData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Create repair garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating repair garment type"
    };
  }
}

// Update repair garment type (admin)
export async function updateRepairGarmentType(garmentId, garmentData) {
  try {
    const response = await axios.put(
      `${BASE_URL}/repair-garment-types/${garmentId}`,
      garmentData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Update repair garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating repair garment type"
    };
  }
}

// Delete repair garment type (admin) - permanently deletes the record
export async function deleteRepairGarmentType(garmentId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/repair-garment-types/${garmentId}?permanent=true`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Delete repair garment type error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting repair garment type"
    };
  }
}

