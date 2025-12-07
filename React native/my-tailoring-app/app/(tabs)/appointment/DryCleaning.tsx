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
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
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
          const uploadResponse = await fetch('http://192.168.254.102:5000/api/dry-cleaning/upload-image', {
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

      // Prepare dry cleaning data for backend
      const dryCleaningData = {
        serviceType: 'dry_cleaning',
        serviceId: 3,
        serviceName: `${selectedItem} Dry Cleaning`,
        basePrice: unitPrice.toString(),
        finalPrice: totalPrice.toString(),
        quantity: qty,
        specificData: {
          garmentType: selectedItem,
          clothingBrand: clothingBrand,
          specialInstructions: specialInstructions,
          quantity: qty,
          imageUrl: imageUrl || 'no-image',
          pickupDate: pickupDate.toISOString()
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.25 }}
      >
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dry Cleaning Service</Text>
            <Text style={styles.cardSubtitle}>
              We will make it fresh and clean
            </Text>
          </View>

          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadContent}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="camera-outline" size={36} color="#9dc5e3" />
                </View>
                <Text style={styles.uploadText}>
                  Tap to upload photo of garment
                </Text>
                <Text style={styles.uploadSubtext}>
                  Clear image helps us serve you better
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Type of Garment *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedItem}
                onValueChange={(value) => setSelectedItem(value)}
                style={styles.picker}
                dropdownIconColor="#9dc5e3"
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
                Price per item: P{getPriceForGarment(selectedItem)}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Clothing Brand (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter brand name (e.g., Nike, Adidas)"
              placeholderTextColor="#94a3b8"
              value={clothingBrand}
              onChangeText={setClothingBrand}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of items (e.g., 3)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
            {selectedItem && quantity && parseInt(quantity) > 0 && (
              <Text style={styles.totalIndicator}>
                Total: P{getPriceForGarment(selectedItem) * parseInt(quantity)}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Special Instructions (Optional)</Text>
            <TextInput
              placeholder="Any special care instructions..."
              style={styles.textArea}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Preferred Pickup Date *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={22} color="#3b82f6" />
              <Text style={styles.dateTimeText}>
                {pickupDate
                  ? pickupDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Tap to select date"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <DateTimePickerModal
              visible={showDatePicker}
              mode="date"
              value={pickupDate}
              minimumDate={new Date()}
              onConfirm={handleDateConfirm}
              onCancel={handlePickerCancel}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.push("./appointmentSelection")}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitBtn]}
              onPress={handleAddService}
            >
              <Text style={styles.submitText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace("/home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <View style={styles.navItemWrapActive}>
          <Ionicons name="receipt-outline" size={20} color="#7A5A00" />
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/cart/Cart")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="cart-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.07,
    paddingBottom: height * 0.03,
  },
  logo: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b",
    flex: 1,
    marginLeft: 10,
  },
  card: {
    marginHorizontal: width * 0.06,
    marginTop: height * 0.04,
    marginBottom: height * 0.04,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    paddingTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: width * 0.065,
    fontWeight: "800",
    color: "#1e293b",
  },
  cardSubtitle: {
    fontSize: width * 0.04,
    color: "#64748b",
    marginTop: 8,
  },
  uploadBox: {
    height: 200,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  previewImage: { width: "100%", height: "100%", borderRadius: 22 },
  uploadContent: { alignItems: "center", paddingHorizontal: 32 },
  uploadIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#475569",
  },
  uploadSubtext: {
    fontSize: 13.5,
    color: "#94a3b8",
    marginTop: 6,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 28,
  },
  label: {
    fontSize: width * 0.042,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
    marginLeft: 4,
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  picker: {
    height: 54,
    color: "#1e293b",
  },
  input: {
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 18,
    padding: 18,
    fontSize: 15.5,
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },
  priceIndicator: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 4,
  },
  totalIndicator: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
    marginLeft: 4,
  },
  textArea: {
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 18,
    padding: 18,
    fontSize: 15.5,
    backgroundColor: "#ffffff",
    minHeight: 130,
    color: "#1e293b",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 18,
    padding: 18,
  },
  dateTimeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  cancelBtn: {
    backgroundColor: "#fee2e2",
    borderWidth: 2,
    borderColor: "#fca5a5",
  },
  submitBtn: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  cancelText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 15,
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  navItemWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  navItemWrapActive: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
});
