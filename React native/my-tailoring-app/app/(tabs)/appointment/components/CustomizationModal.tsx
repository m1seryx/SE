// CustomizationModal.tsx - React Native Customization Modal with 3D Button
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addCustomizationToCart, uploadCustomizationImage } from '../../../../utils/customizationService';

const { width, height } = Dimensions.get('window');

interface CustomizationModalProps {
  visible: boolean;
  onClose: () => void;
}

const GARMENT_TYPES = [
  { id: 'polo', name: 'Polo Shirt', icon: 'shirt-outline', price: 800 },
  { id: 'pants', name: 'Pants', icon: 'body-outline', price: 900 },
  { id: 'suit', name: 'Suit', icon: 'business-outline', price: 2500 },
  { id: 'blazer', name: 'Blazer', icon: 'shirt-outline', price: 1800 },
  { id: 'barong', name: 'Barong Tagalog', icon: 'shirt-outline', price: 2200 },
  { id: 'dress', name: 'Dress', icon: 'woman-outline', price: 1500 },
];

const FABRIC_TYPES = [
  { id: 'cotton', name: 'Cotton' },
  { id: 'silk', name: 'Silk' },
  { id: 'linen', name: 'Linen' },
  { id: 'wool', name: 'Wool' },
  { id: 'polyester', name: 'Polyester' },
];

export default function CustomizationModal({ visible, onClose }: CustomizationModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedGarment, setSelectedGarment] = useState<string>('');
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState('');

  const resetForm = () => {
    setStep(1);
    setSelectedGarment('');
    setSelectedFabric('');
    setImage(null);
    setNotes('');
    setMeasurements('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
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
    // Close modal and navigate to 3D WebView
    onClose();
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

      // Upload image if selected
      if (image) {
        try {
          const formData = new FormData();
          const imageUri = image;
          const filename = imageUri.split('/').pop() || 'photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('customizationImage', {
            uri: imageUri,
            name: filename,
            type,
          } as any);

          const uploadResponse = await uploadCustomizationImage(formData);
          imageUrl = uploadResponse.imageUrl || uploadResponse.data?.imageUrl || imageUrl;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without image
        }
      }

      // Add to cart
      const garmentName = GARMENT_TYPES.find(g => g.id === selectedGarment)?.name || selectedGarment;
      const fabricName = FABRIC_TYPES.find(f => f.id === selectedFabric)?.name || selectedFabric;

      await addCustomizationToCart({
        garmentType: garmentName,
        fabricType: fabricName,
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `${measurements ? `Measurements: ${measurements}\n` : ''}${notes}`,
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
      Alert.alert('Error', error.message || 'Failed to add customization to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🧥 Customization Service</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#5D4037" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
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
              <Text style={styles.dividerText}>OR fill form below</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Step 1: Garment Selection */}
            {step === 1 && (
              <View style={styles.stepContainer}>
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
                        styles.garmentName,
                        selectedGarment === garment.id && styles.garmentNameSelected,
                      ]}>
                        {garment.name}
                      </Text>
                      <Text style={styles.garmentPrice}>₱{garment.price.toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.nextButton, !selectedGarment && styles.buttonDisabled]}
                  onPress={() => selectedGarment && setStep(2)}
                  disabled={!selectedGarment}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Fabric & Details */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionTitle}>Select Fabric Type</Text>
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
                        styles.fabricChipText,
                        selectedFabric === fabric.id && styles.fabricChipTextSelected,
                      ]}>
                        {fabric.name}
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

                {/* Measurements */}
                <Text style={styles.sectionTitle}>Measurements</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Chest: 40in, Waist: 32in..."
                  placeholderTextColor="#A0887D"
                  value={measurements}
                  onChangeText={setMeasurements}
                  multiline
                />

                {/* Notes */}
                <Text style={styles.sectionTitle}>Special Instructions</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  placeholder="Any special requests or notes..."
                  placeholderTextColor="#A0887D"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />

                {/* Price Summary */}
                <View style={styles.priceSummary}>
                  <Text style={styles.priceLabel}>Estimated Price:</Text>
                  <Text style={styles.priceValue}>₱{getSelectedGarmentPrice().toLocaleString()}</Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="arrow-back" size={20} color="#5D4037" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addToCartButton, (!selectedFabric || loading) && styles.buttonDisabled]}
                    onPress={handleAddToCart}
                    disabled={!selectedFabric || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="cart-outline" size={20} color="#fff" />
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF8F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5D4037',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  
  // 3D Banner
  banner3D: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
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
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8D5C4',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#8D6E63',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Steps
  stepContainer: {
    paddingBottom: 40,
  },
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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  garmentCard: {
    width: (width - 60) / 3,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E8D5C4',
  },
  garmentCardSelected: {
    borderColor: '#B8860B',
    backgroundColor: '#FFFEF5',
  },
  garmentName: {
    fontSize: 11,
    color: '#5D4037',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  garmentNameSelected: {
    color: '#B8860B',
    fontWeight: '600',
  },
  garmentPrice: {
    fontSize: 10,
    color: '#8D6E63',
    marginTop: 2,
  },
  
  // Fabric Chips
  fabricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  fabricChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  fabricChipSelected: {
    backgroundColor: '#B8860B',
    borderColor: '#B8860B',
  },
  fabricChipText: {
    fontSize: 13,
    color: '#5D4037',
    fontWeight: '500',
  },
  fabricChipTextSelected: {
    color: '#fff',
  },
  
  // Image Upload
  imageUpload: {
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8D5C4',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    color: '#8D6E63',
    fontSize: 13,
  },
  
  // Text Inputs
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#5D4037',
    borderWidth: 1,
    borderColor: '#E8D5C4',
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Price Summary
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  priceLabel: {
    fontSize: 14,
    color: '#5D4037',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 20,
    color: '#B8860B',
    fontWeight: '700',
  },
  
  // Buttons
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#B8860B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#5D4037',
    gap: 6,
  },
  backButtonText: {
    color: '#5D4037',
    fontSize: 15,
    fontWeight: '600',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#5D4037',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
