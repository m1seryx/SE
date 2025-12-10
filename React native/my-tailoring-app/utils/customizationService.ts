// utils/customizationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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

// Helper to convert base64 image to FormData for upload (React Native compatible)
// Returns both FormData and the temporary file URI for cleanup
export const convertBase64ToFormData = async (
  base64Image: string, 
  filename: string = 'design.png'
): Promise<{ formData: FormData; fileUri: string }> => {
  if (!base64Image) {
    throw new Error('Base64 image data is required');
  }

  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  if (!base64Data) {
    throw new Error('Invalid base64 image data');
  }
  
  // Determine image type from base64 prefix or filename
  let imageType = 'image/png';
  if (base64Image.includes('data:image/jpeg') || base64Image.includes('data:image/jpg')) {
    imageType = 'image/jpeg';
  } else if (base64Image.includes('data:image/png')) {
    imageType = 'image/png';
  } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    imageType = 'image/jpeg';
  }
  
  // Ensure cache directory exists
  if (!FileSystem.cacheDirectory) {
    throw new Error('FileSystem cache directory is not available');
  }
  
  // Save base64 to temporary file with unique name to avoid conflicts
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}-${filename}`;
  let fileUri = `${FileSystem.cacheDirectory}${uniqueFilename}`;
  
  try {
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (writeError: any) {
    console.error('Error writing base64 to file:', writeError);
    throw new Error(`Failed to save image to temporary file: ${writeError?.message || writeError}`);
  }
  
  // For React Native FormData, Android needs file:// prefix, iOS works with or without it
  // Let's use the file URI directly as cacheDirectory provides the correct path
  const formDataUri = Platform.OS === 'android' ? `file://${fileUri}` : fileUri;
  
  // Create FormData with file URI (React Native format)
  const formData = new FormData();
  formData.append('customizationImage', {
    uri: formDataUri,
    type: imageType,
    name: filename,
  } as any);
  
  return { formData, fileUri };
};
