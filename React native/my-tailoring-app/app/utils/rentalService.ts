// app/utils/rentalService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - adjust this to match your backend server
const API_BASE_URL = 'http://192.168.254.107:5000/api';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Generic API call function for rentals
const rentalApiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    console.log('Rental API Call:', url, config);
    
    const response = await fetch(url, config);
    
    console.log('Rental API Response Status:', response.status);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.log('Rental API Error Data:', errorData);
      } catch (jsonError) {
        console.log('Rental API Response Text:', await response.text());
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Rental API Success Result:', result);
    return result;
  } catch (error) {
    console.error('Rental API call error:', error);
    throw error;
  }
};

// Rental API functions
export const rentalService = {
  // Get all available rentals
  getAvailableRentals: async () => {
    return rentalApiCall('/user/rentals');
  },
  
  // Get rental by ID
  getRentalById: async (itemId: string) => {
    return rentalApiCall(`/user/rentals/${itemId}`);
  },
  
  // Get featured rentals
  getFeaturedRentals: async () => {
    return rentalApiCall('/user/rentals/featured');
  },
  
  // Get rentals by category
  getRentalsByCategory: async (category: string) => {
    return rentalApiCall(`/user/rentals/category/${category}`);
  },
  
  // Search rentals
  searchRentals: async (query: string) => {
    return rentalApiCall(`/user/rentals/search?query=${encodeURIComponent(query)}`);
  },
  
  // Get rental categories
  getCategories: async () => {
    return rentalApiCall('/user/rentals/categories');
  },
  
  // Get similar rentals
  getSimilarRentals: async (itemId: string) => {
    return rentalApiCall(`/user/rentals/${itemId}/similar`);
  },
  
  // Get rental image URL
  getImageUrl: (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${API_BASE_URL.replace('/api', '')}${cleanUrl}`;
  }
};

export default rentalService;
