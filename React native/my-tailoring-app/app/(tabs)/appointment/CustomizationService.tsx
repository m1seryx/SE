// CustomizationService.tsx - Full screen version of CustomizationModal
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from '../../../components/DateTimePickerModal';
import { addCustomizationToCart, uploadCustomizationImage } from '../../../utils/customizationService';

const { width, height } = Dimensions.get('window');

// Garment types with prices - matching web
const GARMENT_TYPES: { [key: string]: number } = {
  'Suits': 500,
  'Coat': 400,
  'Barong': 400,
  'Pants': 200,
};

// Default fabric types - these will always be available
const DEFAULT_FABRIC_TYPES: { [key: string]: number } = {
  'Cotton': 200,
  'Silk': 300,
  'Linen': 400,
  'Wool': 200
};

export default function CustomizationService() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<string>('');
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Fabric types from API
  const [fabricTypes, setFabricTypes] = useState<{ [key: string]: number }>(DEFAULT_FABRIC_TYPES);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  
  // Dropdown states
  const [showFabricPicker, setShowFabricPicker] = useState(false);
  const [showGarmentPicker, setShowGarmentPicker] = useState(false);

  // Load fabric types from API on mount
  useEffect(() => {
    loadFabricTypes();
  }, []);

  // Calculate estimated price when selections change
  useEffect(() => {
    if (selectedFabric && selectedGarment) {
      const fabricPrice = fabricTypes[selectedFabric] || 0;
      const garmentPrice = GARMENT_TYPES[selectedGarment] || 0;
      setEstimatedPrice(fabricPrice + garmentPrice);
    } else {
      setEstimatedPrice(0);
    }
  }, [selectedFabric, selectedGarment, fabricTypes]);

  // Load fabric types from API
  const loadFabricTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.202:5000/api'}/fabric-types`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.fabrics && data.fabrics.length > 0) {
          const fabricTypesObj: { [key: string]: number } = { ...DEFAULT_FABRIC_TYPES };
          data.fabrics.forEach((fabric: { fabric_name: string; fabric_price: string }) => {
            fabricTypesObj[fabric.fabric_name] = parseFloat(fabric.fabric_price);
          });
          setFabricTypes(fabricTypesObj);
        }
      }
    } catch (error) {
      console.log('Error loading fabric types:', error);
      // Keep default values
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleDateConfirm = (selectedDate: Date) => {
    setPreferredDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getSelectedGarmentPrice = () => {
    return GARMENT_TYPES[selectedGarment] || 0;
  };

  const getSelectedFabricPrice = () => {
    return fabricTypes[selectedFabric] || 0;
  };

  const handleOpen3DCustomizer = () => {
    router.push('/(tabs)/appointment/Customizer3D');
  };

  const handleAddToCart = async () => {
    if (!selectedGarment) {
      Alert.alert('Missing Information', 'Please select a garment type');
      return;
    }
    if (!selectedFabric) {
      Alert.alert('Missing Information', 'Please select a fabric type');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = 'no-image';

      // Upload image if provided
      if (image) {
        try {
          const formData = new FormData();
          formData.append('customizationImage', {
            uri: image,
            type: 'image/jpeg',
            name: 'customization.jpg',
          } as any);
          
          const uploadResponse = await uploadCustomizationImage(formData);
          imageUrl = uploadResponse.imageUrl || uploadResponse.data?.imageUrl || 'no-image';
        } catch (uploadError) {
          console.log('Image upload failed, continuing without image');
        }
      }

      // Add to cart
      await addCustomizationToCart({
        garmentType: selectedGarment,
        fabricType: selectedFabric,
        preferredDate: preferredDate.toISOString().split('T')[0],
        notes: notes,
        imageUrl: imageUrl,
        estimatedPrice: estimatedPrice,
      });

      Alert.alert(
        'Success!',
        'Customization added to cart!',
        [
          {
            text: 'View Cart',
            onPress: () => {
              router.push('/(tabs)/cart/Cart');
            },
          },
          {
            text: 'Continue',
            onPress: handleClose,
          },
        ]
      );
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', error.message || 'Failed to add to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#5D4037" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧥 Customization Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 3D Customizer Banner */}
        <TouchableOpacity 
          style={styles.banner3D}
          onPress={handleOpen3DCustomizer}
          activeOpacity={0.8}
        >
          <View style={styles.banner3DIcon}>
            <MaterialCommunityIcons name="rotate-3d-variant" size={40} color="#B8860B" />
          </View>
          <View style={styles.banner3DText}>
            <Text style={styles.banner3DTitle}>✨ Try Our 3D Customizer</Text>
            <Text style={styles.banner3DSubtitle}>
              Design your garment in interactive 3D view
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#B8860B" />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR fill out the form</Text>
          <View style={styles.dividerLine} />
        </View>

        {step === 1 && (
          <>
            {/* Garment Type Selection - Dropdown */}
            <Text style={styles.sectionTitle}>Select Garment Type</Text>
            <TouchableOpacity 
              style={styles.dropdownSelector}
              onPress={() => setShowGarmentPicker(true)}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons name="shirt-outline" size={20} color="#8D6E63" />
                <Text style={[styles.dropdownText, !selectedGarment && styles.dropdownPlaceholder]}>
                  {selectedGarment || 'Select a garment type'}
                </Text>
              </View>
              <View style={styles.dropdownRight}>
                {selectedGarment && (
                  <Text style={styles.dropdownPrice}>₱{GARMENT_TYPES[selectedGarment]?.toLocaleString()}</Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#8D6E63" />
              </View>
            </TouchableOpacity>

            {/* Garment Type Picker Modal */}
            <Modal
              visible={showGarmentPicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowGarmentPicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowGarmentPicker(false)}
              >
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Garment Type</Text>
                    <TouchableOpacity onPress={() => setShowGarmentPicker(false)}>
                      <Ionicons name="close" size={24} color="#5D4037" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScroll}>
                    {Object.entries(GARMENT_TYPES).map(([name, price]) => (
                      <TouchableOpacity
                        key={name}
                        style={[
                          styles.pickerOption,
                          selectedGarment === name && styles.pickerOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedGarment(name);
                          setShowGarmentPicker(false);
                        }}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          selectedGarment === name && styles.pickerOptionTextSelected,
                        ]}>
                          {name}
                        </Text>
                        <Text style={[
                          styles.pickerOptionPrice,
                          selectedGarment === name && styles.pickerOptionPriceSelected,
                        ]}>
                          ₱{price.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Fabric Type Selection - Dropdown */}
            <Text style={styles.sectionTitle}>Select Fabric</Text>
            <TouchableOpacity 
              style={styles.dropdownSelector}
              onPress={() => setShowFabricPicker(true)}
            >
              <View style={styles.dropdownLeft}>
                <MaterialCommunityIcons name="palette-swatch-outline" size={20} color="#8D6E63" />
                <Text style={[styles.dropdownText, !selectedFabric && styles.dropdownPlaceholder]}>
                  {selectedFabric || 'Select a fabric type'}
                </Text>
              </View>
              <View style={styles.dropdownRight}>
                {selectedFabric && (
                  <Text style={styles.dropdownPrice}>₱{fabricTypes[selectedFabric]?.toLocaleString()}</Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#8D6E63" />
              </View>
            </TouchableOpacity>

            {/* Fabric Type Picker Modal */}
            <Modal
              visible={showFabricPicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowFabricPicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowFabricPicker(false)}
              >
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Fabric Type</Text>
                    <TouchableOpacity onPress={() => setShowFabricPicker(false)}>
                      <Ionicons name="close" size={24} color="#5D4037" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScroll}>
                    {Object.entries(fabricTypes).map(([name, price]) => (
                      <TouchableOpacity
                        key={name}
                        style={[
                          styles.pickerOption,
                          selectedFabric === name && styles.pickerOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedFabric(name);
                          setShowFabricPicker(false);
                        }}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          selectedFabric === name && styles.pickerOptionTextSelected,
                        ]}>
                          {name}
                        </Text>
                        <Text style={[
                          styles.pickerOptionPrice,
                          selectedFabric === name && styles.pickerOptionPriceSelected,
                        ]}>
                          ₱{price.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Price Estimate */}
            {selectedGarment && selectedFabric && (
              <View style={styles.priceEstimateCard}>
                <Text style={styles.priceEstimateTitle}>Estimated Price</Text>
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Garment ({selectedGarment}):</Text>
                    <Text style={styles.priceValue}>₱{GARMENT_TYPES[selectedGarment]?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Fabric ({selectedFabric}):</Text>
                    <Text style={styles.priceValue}>₱{fabricTypes[selectedFabric]?.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.priceRow, styles.priceTotalRow]}>
                    <Text style={styles.priceTotalLabel}>Total:</Text>
                    <Text style={styles.priceTotalValue}>₱{estimatedPrice.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Image Upload */}
            <Text style={styles.sectionTitle}>Reference Image (Optional)</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#8D6E63" />
                  <Text style={styles.uploadText}>Tap to upload image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.primaryButton, (!selectedGarment || !selectedFabric) && styles.buttonDisabled]}
              onPress={() => setStep(2)}
              disabled={!selectedGarment || !selectedFabric}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Garment:</Text>
                <Text style={styles.summaryValue}>
                  {selectedGarment}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fabric:</Text>
                <Text style={styles.summaryValue}>
                  {selectedFabric}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Garment Price:</Text>
                <Text style={styles.summaryValue}>₱{getSelectedGarmentPrice().toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fabric Price:</Text>
                <Text style={styles.summaryValue}>₱{getSelectedFabricPrice().toLocaleString()}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelTotal}>Estimated Total:</Text>
                <Text style={styles.summaryPrice}>₱{estimatedPrice.toLocaleString()}</Text>
              </View>
            </View>

            {/* Measurements */}
            <Text style={styles.sectionTitle}>Measurements (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter your measurements (chest, waist, length, etc.)"
              value={measurements}
              onChangeText={setMeasurements}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            {/* Preferred Date */}
            <Text style={styles.sectionTitle}>Preferred Completion Date</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#8D6E63" />
              <Text style={styles.datePickerText}>
                {preferredDate.toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#8D6E63" />
            </TouchableOpacity>

            <DateTimePickerModal
              visible={showDatePicker}
              mode="date"
              value={preferredDate}
              minimumDate={new Date()}
              onConfirm={handleDateConfirm}
              onCancel={handleDateCancel}
            />

            {/* Notes */}
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any special requests or design details..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep(1)}
              >
                <Ionicons name="arrow-back" size={20} color="#5D4037" />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, styles.addToCartButton]}
                onPress={handleAddToCart}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>Add to Cart</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
    backgroundColor: '#FFFEF9',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5D4037',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // 3D Banner
  banner3D: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#B8860B',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  banner3DIcon: {
    marginRight: 12,
  },
  banner3DText: {
    flex: 1,
  },
  banner3DTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 2,
  },
  banner3DSubtitle: {
    fontSize: 12,
    color: '#8D6E63',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8D5C4',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#8D6E63',
    fontSize: 13,
    fontWeight: '500',
  },

  // Section Title
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 12,
    marginTop: 8,
  },

  // Garment Grid
  garmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  garmentCard: {
    width: (width - 64) / 3,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8D5C4',
  },
  garmentCardSelected: {
    borderColor: '#B8860B',
    backgroundColor: '#FFF8E7',
  },
  garmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D4037',
    marginTop: 6,
  },
  garmentLabelSelected: {
    color: '#B8860B',
  },
  garmentPrice: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },

  // Fabric
  fabricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  fabricChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  fabricChipSelected: {
    backgroundColor: '#B8860B',
    borderColor: '#B8860B',
  },
  fabricLabel: {
    fontSize: 13,
    color: '#5D4037',
    fontWeight: '500',
  },
  fabricLabelSelected: {
    color: '#FFF',
  },

  // Image Upload
  imageUpload: {
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8D5C4',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 20,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFEF9',
  },
  uploadText: {
    marginTop: 8,
    color: '#8D6E63',
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8D6E63',
  },
  summaryLabelTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4037',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4037',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B8860B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E8D5C4',
    marginVertical: 10,
  },

  // Dropdown Selector
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8D5C4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
  },

  // Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModal: {
    backgroundColor: '#FFFBF0',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5D4037',
  },
  pickerScroll: {
    maxHeight: 350,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E8',
  },
  pickerOptionSelected: {
    backgroundColor: '#FFF8E7',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#5D4037',
  },
  pickerOptionTextSelected: {
    fontWeight: '600',
    color: '#B8860B',
  },
  pickerOptionPrice: {
    fontSize: 14,
    color: '#8D6E63',
  },
  pickerOptionPriceSelected: {
    fontWeight: '600',
    color: '#B8860B',
  },

  // Price Estimate Card
  priceEstimateCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  priceEstimateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 12,
    textAlign: 'center',
  },
  priceBreakdown: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTotalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8D5C4',
  },
  priceLabel: {
    fontSize: 14,
    color: '#8D6E63',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5D4037',
  },
  priceTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4037',
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B8860B',
  },

  // Text Area
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },

  // Date Picker
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D5C4',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8860B',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#5D4037',
  },
  secondaryButtonText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addToCartButton: {
    flex: 1,
  },
});

