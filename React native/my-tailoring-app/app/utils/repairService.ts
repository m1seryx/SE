// app/utils/repairService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiCall from './apiService';

// Upload repair image
export const uploadRepairImage = async (formData: FormData) => {
  const token = await AsyncStorage.getItem('userToken');
  
  const response = await fetch('http://192.168.1.202:5000/api/repair/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });
  
  return response;
};

// Add repair item to cart
export const addRepairToCart = async (repairData: any) => {
  // Restructure data to match backend expectations
  const cartData = {
    serviceType: repairData.serviceType || 'repair',
    serviceId: repairData.serviceId || 1,
    quantity: repairData.quantity || 1,
    basePrice: repairData.basePrice || repairData.estimatedPrice || '0',
    finalPrice: repairData.finalPrice || repairData.estimatedPrice || '0',
    pricingFactors: repairData.pricingFactors || {},
    specificData: {
      serviceName: repairData.serviceName,
      damageLevel: repairData.damageLevel,
      damageDescription: repairData.damageDescription,
      damageLocation: repairData.damageLocation,
      garmentType: repairData.garmentType,
      pickupDate: repairData.pickupDate,
      imageUrl: repairData.imageUrl,
      estimatedTime: repairData.estimatedTime,
      ...repairData // Include any other specific data
    },
    rentalDates: repairData.rentalDates || null
  };

  return apiCall('/cart', {
    method: 'POST',
    body: JSON.stringify(cartData),
  });
};

// Get price estimate for damage level
export const getPriceEstimate = async (damageLevel: string) => {
  return apiCall(`/repair/estimate/${damageLevel}`);
};