import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Rental Inventory API calls
export async function getAllRentals() {
  try {
    const response = await axios.get(`${BASE_URL}/rentals`);
    return response.data;
  } catch (error) {
    console.error("Get all rentals error:", error);
    return {
      message: error.response?.data?.message || "Error fetching rentals",
      items: []
    };
  }
}

export async function getAvailableRentals() {
  try {
    const response = await axios.get(`${BASE_URL}/rentals/available`);
    return response.data;
  } catch (error) {
    console.error("Get available rentals error:", error);
    return {
      message: error.response?.data?.message || "Error fetching available rentals",
      items: []
    };
  }
}

export async function getRentalById(item_id) {
  try {
    const response = await axios.get(`${BASE_URL}/rentals/${item_id}`);
    return response.data;
  } catch (error) {
    console.error("Get rental by ID error:", error);
    return {
      message: error.response?.data?.message || "Error fetching rental item",
      item: null
    };
  }
}

export async function createRental(rentalData, imageFile) {
  try {
    const formData = new FormData();
    
    // Add all rental data fields
    Object.keys(rentalData).forEach(key => {
      if (rentalData[key] !== null && rentalData[key] !== undefined) {
        formData.append(key, rentalData[key]);
      }
    });
    
    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const response = await axios.post(`${BASE_URL}/rentals`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Create rental error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error creating rental item"
    };
  }
}

export async function updateRental(item_id, rentalData, imageFile) {
  try {
    const formData = new FormData();
    
    // Add all rental data fields
    Object.keys(rentalData).forEach(key => {
      if (rentalData[key] !== null && rentalData[key] !== undefined) {
        formData.append(key, rentalData[key]);
      }
    });
    
    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const response = await axios.put(`${BASE_URL}/rentals/${item_id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Update rental error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating rental item"
    };
  }
}

export async function updateRentalStatus(item_id, status) {
  try {
    const response = await axios.put(`${BASE_URL}/rentals/${item_id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Update rental status error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating rental status"
    };
  }
}

export async function deleteRental(item_id) {
  try {
    const response = await axios.delete(`${BASE_URL}/rentals/${item_id}`);
    return response.data;
  } catch (error) {
    console.error("Delete rental error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error deleting rental item"
    };
  }
}

export async function searchRentals(searchTerm) {
  try {
    const response = await axios.get(`${BASE_URL}/rentals/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  } catch (error) {
    console.error("Search rentals error:", error);
    return {
      message: error.response?.data?.message || "Error searching rentals",
      items: []
    };
  }
}

export async function getRentalsByCategory(category) {
  try {
    const response = await axios.get(`${BASE_URL}/rentals/category/${encodeURIComponent(category)}`);
    return response.data;
  } catch (error) {
    console.error("Get rentals by category error:", error);
    return {
      message: error.response?.data?.message || "Error fetching rentals by category",
      items: []
    };
  }
}

export async function getRentalCategories() {
  try {
    const response = await axios.get(`${BASE_URL}/rentals/categories`);
    return response.data;
  } catch (error) {
    console.error("Get rental categories error:", error);
    return {
      message: error.response?.data?.message || "Error fetching rental categories",
      categories: []
    };
  }
}

// Helper function to get image URL
export function getRentalImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  // Ensure the URL starts with a forward slash
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${BASE_URL.replace('/api', '')}${cleanUrl}`;
}
