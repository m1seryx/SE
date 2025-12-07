
import AsyncStorage from '@react-native-async-storage/async-storage';


export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.202:5000/api';
const REQUEST_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT || '10000', 10);


const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};


const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};


const apiCall = async (endpoint: string, options: RequestInit = {}) => {
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

    console.log('API Call:', url, config);
    
 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);
      
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log('API Error Data:', errorData);
        } catch (jsonError) {
          console.log('API Response Text:', await response.text());
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API Success Result:', result);
      return result;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms. Please check your network connection and ensure the backend server is running at ${API_BASE_URL}`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Auth API functions
export const authService = {
  login: async (username: string, password: string) => {
    return apiCall('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  
  register: async (userData: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
    phone_number: string;
  }) => {
    return apiCall('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  updateProfile: async (userData: any) => {
    return apiCall('/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  // Get user profile
  getProfile: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const decoded = decodeToken(token);
      if (!decoded) {
        throw new Error('Invalid authentication token');
      }
      
      return {
        success: true,
        user: {
          id: decoded.id,
          first_name: decoded.first_name || '',
          last_name: decoded.last_name || '',
          email: decoded.email || '',
          phone_number: decoded.phone_number || ''
        }
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  },
  
  updateProfilePicture: async (formData: FormData) => {
    const token = await AsyncStorage.getItem('userToken');
    return fetch(`${API_BASE_URL}/profile-picture`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
  }
};

// Cart API functions
export const cartService = {
  // Get user's cart
  getCart: async () => {
    return apiCall('/cart');
  },
  
  // Add item to cart
  addToCart: async (itemData: any) => {
    return apiCall('/cart', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },
  
  // Remove item from cart
  removeFromCart: async (itemId: string) => {
    return apiCall(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  },
  
  // Submit cart as order
  submitCart: async (notes?: string) => {
    return apiCall('/cart/submit', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
  
  // Get cart summary
  getCartSummary: async () => {
    return apiCall('/cart/summary');
  }
};

// Order Tracking API functions
export const orderTrackingService = {
  // Get user's order tracking
  getUserOrderTracking: async () => {
    return apiCall('/tracking');
  },
  
  // Get order item tracking history
  getOrderItemTrackingHistory: async (orderItemId: string) => {
    return apiCall(`/tracking/history/${orderItemId}`);
  },
  
  // Accept price for an order item
  acceptPrice: async (orderItemId: string) => {
    return apiCall(`/orders/${orderItemId}/accept-price`, {
      method: 'POST',
    });
  },
  
  // Decline price for an order item
  declinePrice: async (orderItemId: string) => {
    return apiCall(`/orders/${orderItemId}/decline-price`, {
      method: 'POST',
    });
  }
};

// Notification API functions
export const notificationService = {
  // Get all notifications for the user
  getUserNotifications: async () => {
    return apiCall('/notifications');
  },
  
  // Get unread notifications count
  getUnreadCount: async () => {
    return apiCall('/notifications/unread-count');
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: string) => {
    return apiCall(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    return apiCall('/notifications/read-all', {
      method: 'PUT',
    });
  },
  
  // Delete a notification
  deleteNotification: async (notificationId: string) => {
    return apiCall(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
  
  // Delete all notifications
  deleteAllNotifications: async () => {
    return apiCall('/notifications', {
      method: 'DELETE',
    });
  }
};

// Export the base API call function for other services
export default apiCall;