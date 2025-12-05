// app/(tabs)/appointment/CustomizeClothes.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { cartStore } from "../../utils/cartStore";

const { width, height } = Dimensions.get("window");

export default function CustomizeClothes() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState("");
  const [designPattern, setDesignPattern] = useState("");
  const [fabricType, setFabricType] = useState("");
  const [buttonStyle, setButtonStyle] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Dropdown Options
  const garmentTypes = ["Suit", "Barong", "Trousers", "Shirts", "Coat"];
  const designPatterns = ["Solid", "Stripes", "Checkered", "Floral"];
  const buttonStyles = [
    "Mother of Pearl",
    "Wooden",
    "Gold Accent",
    "Silver Accent",
    "Horn",
    "Plastic (Matte)",
  ];

  const getFabricOptions = () => {
    if (garmentType === "Barong") return ["Jusi", "Piña"];
    return ["Silk", "Wool", "Linen", "Cotton"];
  };

  // Date & Time Picker Logic
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || appointmentDate;
    setShowDatePicker(Platform.OS === "ios");
    if (currentDate) {
      setAppointmentDate(currentDate);
      if (Platform.OS === "android") {
        setShowDatePicker(false);
        setShowTimePicker(true);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime && appointmentDate) {
      const updated = new Date(appointmentDate);
      updated.setHours(selectedTime.getHours());
      updated.setMinutes(selectedTime.getMinutes());
      setAppointmentDate(updated);
    }
  };

  const handleAddToCart = () => {
    if (
      !garmentType ||
      !designPattern ||
      !fabricType ||
      !buttonStyle ||
      !appointmentDate
    ) {
      Alert.alert(
        "Incomplete",
        "Please fill all fields and select appointment date"
      );
      return;
    }

    const price =
      3500 + (fabricType === "Silk" || fabricType === "Piña" ? 1500 : 0);

    const cartItem = {
      id: Date.now().toString(),
      service: "Customization",
      item: garmentType,
      description: `${designPattern} ${fabricType} with ${buttonStyle} buttons`,
      price,
      icon: "shirt-outline" as const,
      garmentType,
      designPattern,
      fabricType,
      buttonStyle,
      image: image || undefined,
      appointmentDate: appointmentDate.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    cartStore.addItem(cartItem);

    Alert.alert("Success!", "Custom design added to cart!", [
      { text: "View Cart", onPress: () => router.push("/(tabs)/cart/Cart") },
      {
        text: "Add Another",
        onPress: () => {
          setImage(null);
          setGarmentType("");
          setDesignPattern("");
          setFabricType("");
          setButtonStyle("");
          setAppointmentDate(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: height * 0.18 }}>
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Design Your Dream Outfit</Text>
            <Text style={styles.cardSubtitle}>
              From vision to reality — tailored just for you
            </Text>
          </View>

          {/* Image Upload */}
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadContent}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="camera-outline" size={36} color="#94665B" />
                </View>
                <Text style={styles.uploadText}>
                  Upload your design inspiration
                </Text>
                <Text style={styles.uploadSubtext}>
                  Sketch, photo, or mood board — we’ll make it real
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Garment Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Garment Type *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={garmentType}
                onValueChange={(v) => {
                  setGarmentType(v);
                  setFabricType("");
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select garment type..." value="" />
                {garmentTypes.map((item) => (
                  <Picker.Item label={item} value={item} key={item} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Design Pattern */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Design Pattern *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={designPattern}
                onValueChange={setDesignPattern}
                style={styles.picker}
              >
                <Picker.Item label="Choose pattern..." value="" />
                {designPatterns.map((p) => (
                  <Picker.Item label={p} value={p} key={p} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Fabric Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Fabric Type *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={fabricType}
                onValueChange={setFabricType}
                style={styles.picker}
                enabled={!!garmentType}
              >
                <Picker.Item
                  label={
                    garmentType ? "Select fabric..." : "Choose garment first"
                  }
                  value=""
                />
                {getFabricOptions().map((f) => (
                  <Picker.Item label={f} value={f} key={f} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Button Style */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Button Style *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={buttonStyle}
                onValueChange={setButtonStyle}
                style={styles.picker}
              >
                <Picker.Item label="Select button style..." value="" />
                {buttonStyles.map((b) => (
                  <Picker.Item label={b} value={b} key={b} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Appointment Date & Time */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Preferred Appointment *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={22} color="#94665B" />
              <Text style={styles.dateTimeText}>
                {appointmentDate
                  ? appointmentDate.toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Tap to select date & time"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={appointmentDate || new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}
            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={appointmentDate || new Date()}
                mode="time"
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.push("../appointment/appointmentSelection")}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitBtn]}
              onPress={handleAddToCart}
            >
              <Text style={styles.submitText}>Add to Cart</Text>
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
  logo: { width: width * 0.12, height: width * 0.12, borderRadius: 14 },
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
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: width * 0.04,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
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
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadText: { fontSize: 17, fontWeight: "700", color: "#475569" },
  uploadSubtext: {
    fontSize: 13.5,
    color: "#94a3b8",
    marginTop: 6,
    textAlign: "center",
  },

  fieldContainer: { marginBottom: 28 },
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
  picker: { height: 54, color: "#1e293b" },

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
    marginTop: 40,
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
    backgroundColor: "#94665B",
    shadowColor: "#94665B",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  cancelText: { color: "#dc2626", fontWeight: "700", fontSize: 16 },
  submitText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },

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
});
