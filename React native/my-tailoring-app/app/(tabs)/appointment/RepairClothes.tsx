// ← SAME IMPORTS AS BEFORE (unchanged)
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

const { width, height } = Dimensions.get("window");

export default function RepairClothes() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [damageType, setDamageType] = useState("");
  const [instruction, setInstruction] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const itemTypes = [
    "Pants",
    "Suit",
    "Dress",
    "Uniform",
    "Jacket",
    "Skirt",
    "Blouse",
  ];
  const damageOptions = [
    "Tears / Holes",
    "Loose seams / Stitch unraveling",
    "Missing buttons / Fasteners",
    "Broken zippers",
    "Fraying edges / Hems",
    "Snags / Pulls",
    "Stretching / Misshaping",
    "Fabric thinning",
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.18 }} // Extra room for nav
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
        </View>

        {/* Main Card - Now with generous outer margin */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Repair Request</Text>
            <Text style={styles.cardSubtitle}>We’ll make it good as new</Text>
          </View>

          {/* Image Upload - More spacious */}
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
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

          {/* Form Fields - Nice vertical spacing */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Type of Garment</Text>
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
                {itemTypes.map((item) => (
                  <Picker.Item label={item} value={item} key={item} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Type of Damage</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={damageType}
                onValueChange={(value) => setDamageType(value)}
                style={styles.picker}
                dropdownIconColor="#9dc5e3"
              >
                <Picker.Item
                  label="Describe the damage..."
                  value=""
                  color="#999"
                />
                {damageOptions.map((damage) => (
                  <Picker.Item label={damage} value={damage} key={damage} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Special Instructions (Optional)</Text>
            <TextInput
              placeholder="e.g., Keep original buttons, match thread color, etc."
              style={styles.textArea}
              multiline
              numberOfLines={5}
              value={instruction}
              onChangeText={setInstruction}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons - Extra margin on top */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.replace("/home")}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitBtn]}
              onPress={() => alert("Repair request submitted successfully!")}
            >
              <Text style={styles.submitText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav - UNCHANGED */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace("/home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <View style={styles.navItemWrapActive}>
          <Ionicons name="receipt-outline" size={20} color="#7A5A00" />
        </View>
        <View style={styles.navItemWrap}>
          <Ionicons name="cart-outline" size={20} color="#9CA3AF" />
        </View>
        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// NEW SPACIOUS & PRETTIER STYLES
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
  profileIcon: { padding: 6 },

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

  // New wrapper for consistent field spacing
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

  textArea: {
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 18,
    padding: 18,
    fontSize: 15.5,
    backgroundColor: "#ffffff",
    minHeight: 130,
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

  // Bottom nav - 100% untouched
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
