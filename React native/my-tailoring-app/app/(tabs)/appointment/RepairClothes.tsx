import React, { useState, useEffect } from "react";
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
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "../../../components/DateTimePickerModal";
import { addRepairToCart, uploadRepairImage } from "../../../utils/repairService";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

export default function RepairClothes() {
  const router = useRouter();

  // Form States
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [damageLevel, setDamageLevel] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  // Damage levels with base prices
  const damageLevels = [
    { value: 'minor', label: 'Minor', basePrice: 300, description: 'Small tears, loose threads, missing buttons' },
    { value: 'moderate', label: 'Moderate', basePrice: 500, description: 'Broken zippers, medium tears, seam repairs' },
    { value: 'major', label: 'Major', basePrice: 800, description: 'Large tears, structural damage, extensive repairs' },
    { value: 'severe', label: 'Severe', basePrice: 1500, description: 'Complete reconstruction, multiple major issues' }
  ];

  const itemTypes = [
    "Shirt", "Pants", "Jacket", "Coat", "Dress", "Skirt", "Suit", "Blouse", "Sweater", "Other"
  ];

  // Calculate estimated price when damage level or garment type changes
  useEffect(() => {
    if (damageLevel) {
      calculateEstimatedPrice();
    } else {
      setEstimatedPrice(0);
    }
  }, [damageLevel, selectedItem]);

  const calculateEstimatedPrice = async () => {
    if (!damageLevel) {
      setEstimatedPrice(0);
      return;
    }

    // Get base price from damage level
    const damageLevelObj = damageLevels.find(level => level.value === damageLevel);
    let basePrice = damageLevelObj ? damageLevelObj.basePrice : 500;
    
    // Add garment type complexity factor
    let garmentMultiplier = 1.0;
    if (selectedItem === 'Suit' || selectedItem === 'Coat') {
      garmentMultiplier = 1.3;
    } else if (selectedItem === 'Dress') {
      garmentMultiplier = 1.2;
    }

    const finalPrice = Math.round(basePrice * garmentMultiplier);
    setEstimatedPrice(finalPrice);
  };

  const getEstimatedTime = (damageLevel: string) => {
    const times: {[key: string]: string} = {
      'minor': '2-3 days',
      'moderate': '3-5 days',
      'major': '5-7 days',
      'severe': '1-2 weeks'
    };
    return times[damageLevel] || '3-5 days';
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImagePreview(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Date & Time Handlers
  const handleDateConfirm = (selectedDate: Date) => {
    setAppointmentDate(selectedDate);
    setShowDatePicker(false);
    // Show time picker after date is selected
    setTimeout(() => setShowTimePicker(true), 300);
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    if (appointmentDate) {
      const updatedDate = new Date(appointmentDate);
      updatedDate.setHours(selectedTime.getHours());
      updatedDate.setMinutes(selectedTime.getMinutes());
      setAppointmentDate(updatedDate);
    } else {
      setAppointmentDate(selectedTime);
    }
    setShowTimePicker(false);
  };

  const handlePickerCancel = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const uploadImageIfNeeded = async () => {
    if (!image) return null;

    try {
      const formData = new FormData();
      formData.append('repairImage', {
        uri: image,
        type: 'image/jpeg',
        name: 'repair-image.jpg',
      } as any);

      const response = await uploadRepairImage(formData);
      const result = await response.json();
      
      if (result.success) {
        return result.data.url || result.data.filename;
      } else {
        throw new Error(result.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleAddService = async () => {
    if (!selectedItem || !damageLevel || !description || !appointmentDate) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields"
      );
      return;
    }

    // Check if user is authenticated
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert(
        "Authentication Required",
        "Please log in to add items to your cart."
      );
      router.push("/login");
      return;
    }

    setLoading(true);
    
    try {
      // Upload image if provided
      let imageUrl = '';
      if (image) {
        try {
          imageUrl = await uploadImageIfNeeded() || 'no-image';
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          Alert.alert('Warning', 'Image upload failed. Continuing without image.');
        }
      }

      // Prepare repair data
      const repairData = {
        serviceType: 'repair', // Add serviceType
        serviceId: 1, // Assuming repair service ID is 1
        quantity: 1, // Add quantity
        serviceName: `${damageLevel} Repair`,
        basePrice: estimatedPrice.toString(),
        finalPrice: estimatedPrice.toString(), // Use finalPrice instead of estimatedPrice
        damageLevel: damageLevel,
        damageDescription: description,
        damageLocation: selectedItem,
        garmentType: selectedItem,
        pickupDate: appointmentDate ? appointmentDate.toISOString() : new Date().toISOString(),
        imageUrl: imageUrl || 'no-image',
        estimatedTime: getEstimatedTime(damageLevel)
      };
      
      // Log the data being sent for debugging
      console.log('Sending repair data to cart:', JSON.stringify(repairData, null, 2));

      // Add to cart via API
      const result = await addRepairToCart(repairData);
      
      if (result.success) {
        Alert.alert(
          "Success!", 
          `Repair service added to cart! Estimated price: ₱${estimatedPrice}`, 
          [
            {
              text: "View Cart",
              onPress: () => router.push("/(tabs)/cart/Cart"),
            },
            {
              text: "Add More",
              onPress: () => {
                setSelectedItem("");
                setDamageLevel("");
                setDescription("");
                setImage(null);
                setImagePreview(null);
                setAppointmentDate(null);
                setEstimatedPrice(0);
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || "Failed to add repair service to cart");
      }
    } catch (error: any) {
      console.error("Add service error:", error);
      // Show more detailed error information
      let errorMessage = error.message || "Failed to add repair service. Please try again.";
      
      // If it's a network error, provide more context
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        errorMessage = "Network error: Unable to connect to the server. Please check your internet connection and ensure the backend server is running."
      }
      
      Alert.alert(
        "Error Adding to Cart", 
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#5D4037" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔧 Repair Request</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Repair Request</Text>
            <Text style={styles.cardSubtitle}>We'll make it good as new</Text>
          </View>

          {/* Image Upload */}
          <Text style={styles.sectionTitle}>Upload Damage Photo (Recommended)</Text>
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {imagePreview ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imagePreview }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#8D6E63" />
                <Text style={styles.uploadText}>Tap to upload photo of damage</Text>
                <Text style={styles.uploadSubtext}>Clear image helps us serve you better</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Garment Type */}
          <Text style={styles.sectionTitle}>Garment Type *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedItem}
              onValueChange={(value) => setSelectedItem(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select garment type..." value="" />
              {itemTypes.map((item) => (
                <Picker.Item label={item} value={item} key={item} />
              ))}
            </Picker>
          </View>

          {/* Damage Level */}
          <Text style={styles.sectionTitle}>Damage Level *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={damageLevel}
              onValueChange={(value) => setDamageLevel(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select damage level..." value="" />
              {damageLevels.map((level) => (
                <Picker.Item 
                  label={`${level.label} - ${level.description}`} 
                  value={level.value} 
                  key={level.value} 
                />
              ))}
            </Picker>
          </View>
          {damageLevel && (
            <Text style={styles.priceIndicator}>
              Estimated price: ₱{estimatedPrice}
            </Text>
          )}

          {/* Detailed Description */}
          <Text style={styles.sectionTitle}>Detailed Description *</Text>
          <TextInput
            placeholder="Please describe the damage in detail (size, location, extent of damage)..."
            style={styles.textArea}
            placeholderTextColor="#999"
            multiline
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <Text style={styles.smallText}>
            Examples: 2-inch hole in left sleeve, broken zipper on jacket back, torn seam on pants
          </Text>

          {/* Appointment Date & Time Picker */}
          <Text style={styles.sectionTitle}>Preferred Appointment Date & Time *</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8D6E63" />
            <Text style={styles.datePickerText}>
              {appointmentDate
                ? appointmentDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }) +
                  ", " +
                  appointmentDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Tap to select date & time"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#8D6E63" />
          </TouchableOpacity>

          {/* Price Estimate */}
          {estimatedPrice > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Estimated Price: ₱{estimatedPrice}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Damage Level:</Text>
                <Text style={styles.summaryValue}>{damageLevel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Garment Type:</Text>
                <Text style={styles.summaryValue}>{selectedItem}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Time:</Text>
                <Text style={styles.summaryValue}>{getEstimatedTime(damageLevel)}</Text>
              </View>
              <Text style={styles.summaryNote}>
                Final price will be confirmed after admin review
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("./appointmentSelection")}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#5D4037" />
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, (!estimatedPrice || loading) && styles.buttonDisabled]}
              onPress={handleAddService}
              disabled={loading || !estimatedPrice}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color="#FFF" />
                  <Text style={styles.primaryButtonText}>
                    Add to Cart - ₱{estimatedPrice || 0}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        visible={showDatePicker}
        mode="date"
        value={appointmentDate || new Date()}
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={handlePickerCancel}
      />

      {/* Time Picker Modal */}
      <DateTimePickerModal
        visible={showTimePicker}
        mode="time"
        value={appointmentDate || new Date()}
        onConfirm={handleTimeConfirm}
        onCancel={handlePickerCancel}
      />
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  cardHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8D6E63',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 12,
    marginTop: 8,
  },
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
    fontWeight: '600',
  },
  uploadSubtext: {
    marginTop: 4,
    color: '#8D6E63',
    fontSize: 12,
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E8D5C4',
    borderRadius: 12,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: {
    height: 50,
    color: '#333',
  },
  priceIndicator: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  smallText: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 6,
    marginBottom: 16,
  },
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
  summaryCard: {
    backgroundColor: '#FFF8E7',
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
  summaryNote: {
    fontSize: 12,
    color: '#8D6E63',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8860B',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    flex: 1,
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
});
