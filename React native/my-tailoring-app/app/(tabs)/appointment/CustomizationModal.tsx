// CustomizationModal.tsx - Modal for customization with 3D WebView option
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from '../../../components/DateTimePickerModal';
import { addCustomizationToCart, uploadCustomizationImage } from '../../../utils/customizationService';

const { width, height } = Dimensions.get('window');

interface CustomizationModalProps {
  visible: boolean;
  onClose: () => void;
}

const GARMENT_TYPES = [
  { id: 'shirt', label: 'Shirt', icon: 'shirt-outline', price: 800 },
  { id: 'pants', label: 'Pants', icon: 'body-outline', price: 900 },
  { id: 'suit', label: 'Suit', icon: 'bowtie-outline', price: 2500 },
  { id: 'dress', label: 'Dress', icon: 'woman-outline', price: 1800 },
  { id: 'blazer', label: 'Blazer', icon: 'shirt-outline', price: 2000 },
  { id: 'barong', label: 'Barong', icon: 'shirt-outline', price: 3000 },
];

const FABRIC_TYPES = [
  { id: 'cotton', label: 'Cotton' },
  { id: 'silk', label: 'Silk' },
  { id: 'linen', label: 'Linen' },
  { id: 'wool', label: 'Wool' },
  { id: 'polyester', label: 'Polyester' },
];

export default function CustomizationModal({ visible, onClose }: CustomizationModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<string>('');
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const resetForm = () => {
    setStep(1);
    setImage(null);
    setSelectedGarment('');
    setSelectedFabric('');
    setNotes('');
    setMeasurements('');
    setPreferredDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
    const garment = GARMENT_TYPES.find(g => g.id === selectedGarment);
    return garment?.price || 1000;
  };

  const handleOpen3DCustomizer = () => {
    handleClose();
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
        garmentType: GARMENT_TYPES.find(g => g.id === selectedGarment)?.label || selectedGarment,
        fabricType: FABRIC_TYPES.find(f => f.id === selectedFabric)?.label || selectedFabric,
        preferredDate: preferredDate.toISOString().split('T')[0],
        notes: notes,
        imageUrl: imageUrl,
        estimatedPrice: getSelectedGarmentPrice(),
      });

      Alert.alert(
        'Success!',
        'Customization added to cart!',
        [
          {
            text: 'View Cart',
            onPress: () => {
              handleClose();
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
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
              {/* Garment Type Selection */}
              <Text style={styles.sectionTitle}>Select Garment Type</Text>
              <View style={styles.garmentGrid}>
                {GARMENT_TYPES.map((garment) => (
                  <TouchableOpacity
                    key={garment.id}
                    style={[
                      styles.garmentCard,
                      selectedGarment === garment.id && styles.garmentCardSelected,
                    ]}
                    onPress={() => setSelectedGarment(garment.id)}
                  >
                    <Ionicons
                      name={garment.icon as any}
                      size={28}
                      color={selectedGarment === garment.id ? '#B8860B' : '#8D6E63'}
                    />
                    <Text style={[
                      styles.garmentLabel,
                      selectedGarment === garment.id && styles.garmentLabelSelected,
                    ]}>
                      {garment.label}
                    </Text>
                    <Text style={styles.garmentPrice}>₱{garment.price.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fabric Type */}
              <Text style={styles.sectionTitle}>Select Fabric</Text>
              <View style={styles.fabricRow}>
                {FABRIC_TYPES.map((fabric) => (
                  <TouchableOpacity
                    key={fabric.id}
                    style={[
                      styles.fabricChip,
                      selectedFabric === fabric.id && styles.fabricChipSelected,
                    ]}
                    onPress={() => setSelectedFabric(fabric.id)}
                  >
                    <Text style={[
                      styles.fabricLabel,
                      selectedFabric === fabric.id && styles.fabricLabelSelected,
                    ]}>
                      {fabric.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
                    {GARMENT_TYPES.find(g => g.id === selectedGarment)?.label}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fabric:</Text>
                  <Text style={styles.summaryValue}>
                    {FABRIC_TYPES.find(f => f.id === selectedFabric)?.label}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Estimated Price:</Text>
                  <Text style={styles.summaryPrice}>₱{getSelectedGarmentPrice().toLocaleString()}</Text>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
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
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4037',
  },
  summaryPrice: {
    fontSize: 16,
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
