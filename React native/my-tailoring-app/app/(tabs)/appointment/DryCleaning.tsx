// app/(tabs)/appointment/DryCleaning.tsx
import React, { useState } from "react";
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
import { cartService } from "../../../utils/apiService";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

export default function DryCleaningClothes() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [clothingBrand, setClothingBrand] = useState("");
  const [pickupDate, setPickupDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Date Handler - only date, no time
  const handleDateConfirm = (selectedDate: Date) => {
    setPickupDate(selectedDate);
    setShowDatePicker(false);
  };

  const handlePickerCancel = () => {
    setShowDatePicker(false);
  };

  const garmentTypes = [
    "Shirt",
    "Pants",
    "Suit",
    "Dress",
    "Jacket",
    "Coat",
    "Skirt",
    "Blouse",
    "Wedding Gown",
    "Barong",
  ];

  const getPriceForGarment = (garment: string): number => {
    const prices: { [key: string]: number } = {
      Shirt: 150,
      Pants: 180,
      Suit: 400,
      Dress: 350,
      Jacket: 250,
      Coat: 300,
      Skirt: 200,
      Blouse: 150,
      "Wedding Gown": 1200,
      Barong: 250,
    };
    return prices[garment] || 200;
  };

  const handleAddService = async () => {
    if (!selectedItem || !quantity) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity");
      return;
    }

    const unitPrice = getPriceForGarment(selectedItem);
    const totalPrice = unitPrice * qty;

    let description = `${qty} ${selectedItem}(s) - Professional dry cleaning`;
    if (clothingBrand) {
      description += ` (${clothingBrand})`;
    }
    if (specialInstructions) {
      description += ` - ${specialInstructions}`;
    }

    try {
      // Upload image if provided
      let imageUrl = '';
      if (image) {
        try {
          const formData = new FormData();
          formData.append('dryCleaningImage', {
            uri: image,
            type: 'image/jpeg',
            name: 'dryclean-image.jpg',
          } as any);

          const token = await AsyncStorage.getItem('userToken');
          const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://192.168.254.106:5000';
          const uploadResponse = await fetch(`${API_BASE}/api/dry-cleaning/upload-image`, {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData,
          });

          const uploadResult = await uploadResponse.json();
          
          if (uploadResult.success) {
            imageUrl = uploadResult.data.url || uploadResult.data.filename || '';
            console.log('Image uploaded successfully, URL:', imageUrl);
          } else {
            console.warn('Image upload failed, continuing without image:', uploadResult.message);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          Alert.alert('Warning', 'Image upload failed. Continuing without image.');
        }
      }

      // Prepare dry cleaning data for backend (matching web app structure)
      const pricePerItem = getPriceForGarment(selectedItem);
      const isEstimatedPrice = false; // Since we have fixed prices per garment type
      
      const dryCleaningData = {
        serviceType: 'dry_cleaning',
        serviceId: null, // Backend will generate
        quantity: qty,
        basePrice: '0',
        finalPrice: totalPrice.toString(),
        pricingFactors: {
          quantity: qty,
          pricePerItem: pricePerItem.toString(),
          pickupDate: pickupDate.toISOString()
        },
        specificData: {
          serviceName: `${selectedItem} Dry Cleaning`,
          brand: clothingBrand || '',
          notes: specialInstructions || '',
          garmentType: selectedItem,
          quantity: qty,
          imageUrl: imageUrl || 'no-image',
          pickupDate: pickupDate.toISOString(),
          pricePerItem: pricePerItem.toString(),
          isEstimatedPrice: isEstimatedPrice,
          uploadedAt: new Date().toISOString()
        }
      };

      const result = await cartService.addToCart(dryCleaningData);
      
      if (result.success) {
        Alert.alert("Success!", "Dry cleaning service added to cart!", [
          {
            text: "View Cart",
            onPress: () => router.push("/(tabs)/cart/Cart"),
          },
          {
            text: "Add More",
            onPress: () => {
              setSelectedItem("");
              setQuantity("");
              setSpecialInstructions("");
              setClothingBrand("");
              setImage(null);
              setPickupDate(new Date());
            },
          },
        ]);
      } else {
        throw new Error(result.message || "Failed to add dry cleaning service to cart");
      }
    } catch (error: any) {
      console.error("Add service error:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to add dry cleaning service. Please try again."
      );
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
        <Text style={styles.headerTitle}>🧺 Dry Cleaning Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dry Cleaning Service</Text>
            <Text style={styles.cardSubtitle}>
              We will make it fresh and clean
            </Text>
          </View>

          {/* Image Upload */}
          <Text style={styles.sectionTitle}>Upload Photo of Garment (Optional)</Text>
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#8D6E63" />
                <Text style={styles.uploadText}>Tap to upload photo of garment</Text>
                <Text style={styles.uploadSubtext}>Clear image helps us serve you better</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Type of Garment */}
          <Text style={styles.sectionTitle}>Type of Garment *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedItem}
              onValueChange={(value) => setSelectedItem(value)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select garment type..."
                value=""
                color="#999"
              />
              {garmentTypes.map((item) => (
                <Picker.Item label={item} value={item} key={item} />
              ))}
            </Picker>
          </View>
          {selectedItem && (
            <Text style={styles.priceIndicator}>
              Price per item: ₱{getPriceForGarment(selectedItem)}
            </Text>
          )}

          {/* Clothing Brand */}
          <Text style={styles.sectionTitle}>Clothing Brand (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter brand name (e.g., Nike, Adidas)"
            placeholderTextColor="#999"
            value={clothingBrand}
            onChangeText={setClothingBrand}
          />

          {/* Quantity */}
          <Text style={styles.sectionTitle}>Quantity *</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of items (e.g., 3)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
          {selectedItem && quantity && parseInt(quantity) > 0 && (
            <Text style={styles.totalIndicator}>
              Total: ₱{getPriceForGarment(selectedItem) * parseInt(quantity)}
            </Text>
          )}

          {/* Special Instructions */}
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            placeholder="Any special care instructions..."
            style={styles.textArea}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            textAlignVertical="top"
          />

          {/* Drop off date */}
          <Text style={styles.sectionTitle}>Drop off item date *</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8D6E63" />
            <Text style={styles.datePickerText}>
              {pickupDate
                ? pickupDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Tap to select date"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#8D6E63" />
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("./appointmentSelection")}
            >
              <Ionicons name="arrow-back" size={20} color="#5D4037" />
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddService}
            >
              <Ionicons name="cart-outline" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        visible={showDatePicker}
        mode="date"
        value={pickupDate}
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
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
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  input: {
    borderWidth: 1,
    borderColor: '#E8D5C4',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#FFF',
    color: '#333',
    marginBottom: 16,
  },
  priceIndicator: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 16,
  },
  totalIndicator: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
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
