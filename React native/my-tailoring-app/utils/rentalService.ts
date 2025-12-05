// app/utils/rentalService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - use environment variable or default
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.254.103:5000/api';
const REQUEST_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT || '10000', 10);

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Generic API call function for rentals with timeout
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
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);
      
      console.log('Rental API Response Status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('Rental API Error Data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.log('Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Rental API Success Result:', result);
      return result;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms. Please check your network connection.`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Rental API call error:', error);
    throw error;
  }
};

// Rental API functions
export const rentalService = {
  // Get all available rentals
  getAvailableRentals: async () => {
    return rentalApiCall('/rentals/available');
  },
  
  // Get rental by ID
  getRentalById: async (itemId: string) => {
    return rentalApiCall(`/rentals/${itemId}`);
  },
  
  // Get featured rentals
  getFeaturedRentals: async () => {
    return rentalApiCall('/rentals');
  },
  
  // Get rentals by category
  getRentalsByCategory: async (category: string) => {
    return rentalApiCall(`/rentals/category/${category}`);
  },
  
  // Search rentals
  searchRentals: async (query: string) => {
    return rentalApiCall(`/rentals/search?query=${encodeURIComponent(query)}`);
  },
  
  // Get rental categories
  getCategories: async () => {
    return rentalApiCall('/rentals/categories');
  },
  
  // Get similar rentals
  getSimilarRentals: async (itemId: string) => {
    return rentalApiCall(`/rentals/${itemId}/similar`);
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
