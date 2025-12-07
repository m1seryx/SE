// utils/customizationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiCall from './apiService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.202:5000/api';
const REQUEST_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT || '10000', 10);

// Upload customization image (design preview from 3D customizer)
export const uploadCustomizationImage = async (formData: FormData) => {
  const token = await AsyncStorage.getItem('userToken');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${API_BASE_URL}/customization/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload image');
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Add customization item to cart
export const addCustomizationToCart = async (customizationData: {
  garmentType: string;
  fabricType: string;
  preferredDate?: string;
  notes?: string;
  imageUrl?: string;
  designData?: any;
  estimatedPrice?: number;
}) => {
  // Restructure data to match backend expectations
  const cartData = {
    serviceType: 'customization',
    serviceId: Date.now(), // Generate unique ID
    quantity: 1,
    basePrice: customizationData.estimatedPrice || 500,
    finalPrice: customizationData.estimatedPrice || 500,
    pricingFactors: {
      fabricType: customizationData.fabricType,
      garmentType: customizationData.garmentType,
      designComplexity: 'standard',
      preferredDate: customizationData.preferredDate
    },
    specificData: {
      garmentType: customizationData.garmentType,
      fabricType: customizationData.fabricType,
      measurements: customizationData.notes || '',
      notes: customizationData.notes || '',
      preferredDate: customizationData.preferredDate || '',
      imageUrl: customizationData.imageUrl || 'no-image',
      designData: customizationData.designData || {},
      uploadedAt: new Date().toISOString()
    },
    rentalDates: null
  };

  return apiCall('/cart', {
    method: 'POST',
    body: JSON.stringify(cartData),
  });
};

// Get user's customization orders
export const getUserCustomizationOrders = async () => {
  return apiCall('/customization/user', {
    method: 'GET',
  });
};

// Get all customization orders (admin)
export const getAllCustomizationOrders = async () => {
  return apiCall('/customization', {
    method: 'GET',
  });
};

// Get customization order by ID
export const getCustomizationOrderById = async (itemId: number) => {
  return apiCall(`/customization/${itemId}`, {
    method: 'GET',
  });
};

// Update customization order (admin)
export const updateCustomizationOrderItem = async (
  itemId: number, 
  updateData: {
    finalPrice?: number;
    approvalStatus?: string;
    adminNotes?: string;
  }
) => {
  return apiCall(`/customization/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

// Get customization stats (admin)
export const getCustomizationStats = async () => {
  return apiCall('/customization/stats', {
    method: 'GET',
  });
};

// Helper to convert base64 image to FormData for upload
export const convertBase64ToFormData = (base64Image: string, filename: string = 'design.png'): FormData => {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to blob
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  const formData = new FormData();
  formData.append('customizationImage', blob as any, filename);
  
  return formData;
};
