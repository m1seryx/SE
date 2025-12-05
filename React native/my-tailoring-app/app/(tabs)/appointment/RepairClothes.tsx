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
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addRepairToCart, uploadRepairImage } from "../../utils/repairService";
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
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || appointmentDate;
    setShowDatePicker(Platform.OS === "ios");

    if (currentDate) {
      setAppointmentDate(currentDate);
      if (Platform.OS === "android") {
        setShowDatePicker(false);
        setShowTimePicker(true); // Open time picker right after
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");

    if (selectedTime && appointmentDate) {
      const updatedDate = new Date(appointmentDate);
      updatedDate.setHours(selectedTime.getHours());
      updatedDate.setMinutes(selectedTime.getMinutes());
      setAppointmentDate(updatedDate);
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.18 }}
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
            <Text style={styles.cardTitle}>Repair Request</Text>
            <Text style={styles.cardSubtitle}>We'll make it good as new</Text>
          </View>

          {/* Image Upload */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Upload Damage Photo (Recommended)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {imagePreview ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imagePreview }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                    <Text style={styles.removeImageText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="camera-outline" size={36} color="#9dc5e3" />
                  </View>
                  <Text style={styles.uploadText}>
                    Tap to upload photo of damage
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    Clear image helps us serve you better
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Garment Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Garment Type *</Text>
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
          </View>

          {/* Damage Level */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Damage Level *</Text>
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
          </View>

          {/* Detailed Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Detailed Description *</Text>
            <TextInput
              placeholder="Please describe the damage in detail (size, location, extent of damage)..."
              style={styles.textArea}
              placeholderTextColor="#94a3b8"
              multiline
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            <Text style={styles.smallText}>
              Examples: 2-inch hole in left sleeve, broken zipper on jacket back, torn seam on pants
            </Text>
          </View>

          {/* Appointment Date & Time Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Preferred Appointment Date & Time *
            </Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={22} color="#94665B" />
              <Text style={styles.dateTimeText}>
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
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={appointmentDate || new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            {/* Time Picker (Android only after date) */}
            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={appointmentDate || new Date()}
                mode="time"
                is24Hour={false}
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* Price Estimate */}
          {estimatedPrice > 0 && (
            <View style={styles.estimateContainer}>
              <Text style={styles.estimateTitle}>Estimated Price: ₱{estimatedPrice}</Text>
              <Text style={styles.estimateDetail}>
                Based on damage level: {damageLevel} • Garment type: {selectedItem}
              </Text>
              <Text style={styles.estimateTime}>
                ⏱️ Estimated time: {getEstimatedTime(damageLevel)}
              </Text>
              <Text style={styles.estimateNote}>
                Final price will be confirmed after admin review
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.push("./appointmentSelection")}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitBtn]}
              onPress={handleAddService}
              disabled={loading || !estimatedPrice}
            >
              <Text style={styles.submitText}>
                {loading ? "Adding..." : `Add to Cart - ₱${estimatedPrice || 0}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navItemWrap}>
          <TouchableOpacity onPress={() => router.replace("/home")}>
            <View style={styles.navItemWrap}>
              <Ionicons name="home" size={22} color="#9CA3AF" />
              <Text style={styles.navLabel}>Home</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
          style={styles.navItemWrapActive}
        >
          <Ionicons name="calendar-outline" size={22} color="#78350F" />
          <Text style={styles.navLabelActive}>Book</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/cart/Cart")}
          style={styles.navItemWrap}
        >
          <View style={styles.cartBadgeContainer}>
            <Ionicons name="cart-outline" size={22} color="#64748B" />
          </View>
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("../UserProfile/profile")}
          style={styles.navItemWrap}
        >
          <Ionicons name="person-outline" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Profile</Text>
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
    marginBottom: 16,
  },
  imagePreviewContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    position: "relative",
  },
  previewImage: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 22 
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    padding: 8,
  },
  removeImageText: {
    color: "white",
    fontWeight: "bold",
  },
  uploadContent: { 
    alignItems: "center", 
    paddingHorizontal: 32 
  },
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
  priceIndicator: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
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
  smallText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
    marginLeft: 4,
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
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  navItemWrap: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 4,
  },
  navItemWrapActive: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  navLabelActive: {
    fontSize: 11,
    color: "#78350F",
    fontWeight: "700",
  },
  cartBadgeContainer: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
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
  estimateContainer: {
    backgroundColor: "#eff6ff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  estimateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 8,
  },
  estimateDetail: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  estimateTime: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  estimateNote: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
  },
});