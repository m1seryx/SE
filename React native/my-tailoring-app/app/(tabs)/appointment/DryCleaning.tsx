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

export default function DryCleaningClothes() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [clothingBrand, setClothingBrand] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.12 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dry Cleaning Service</Text>
            <Text style={styles.cardSubtitle}>Fill in your details</Text>
          </View>

          {/* Upload Photo */}
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="cloud-upload-outline" size={28} color="#777" />
                <Text style={{ color: "#777", marginTop: 5 }}>
                  Upload a photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Type of Garment */}
          <Text style={styles.label}>Type of Garment</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedItem}
              onValueChange={(value) => setSelectedItem(value)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select garment (shirt, pants, suit, dress...)"
                value=""
              />
              {garmentTypes.map((item, index) => (
                <Picker.Item label={item} value={item} key={index} />
              ))}
            </Picker>
          </View>

          {/* Clothing Brand */}
          <Text style={styles.label}>Clothing Brand (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter brand name (e.g., Nike, Adidas)"
            value={clothingBrand}
            onChangeText={setClothingBrand}
          />

          {/* Quantity */}
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of items (e.g., 3)"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          {/* Special Instructions */}
          <Text style={styles.label}>Special Instructions (Optional)</Text>
          <TextInput
            placeholder="Any special care instructions..."
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.push("../home")}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitBtn]}
              onPress={() => {
                if (!selectedItem || !quantity) {
                  alert("Please fill in all required fields");
                  return;
                }
                alert("Dry cleaning request submitted!");
                router.push("../appointment/appointmentSelection");
              }}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  header: {
    marginTop: height * 0.05,
    paddingHorizontal: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: width * 0.08, height: width * 0.08, borderRadius: 50 },
  headerTitle: {
    fontWeight: "600",
    fontSize: width * 0.035,
    color: "#222",
    flex: 1,
    marginLeft: 8,
  },
  profileIcon: { marginLeft: 8 },

  card: {
    backgroundColor: "#fff",
    width: "85%",
    alignSelf: "center",
    marginTop: height * 0.05,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    paddingBottom: 15,
  },
  cardHeader: {
    backgroundColor: "#cfd8e4",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: height * 0.02,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: width * 0.04,
    fontWeight: "700",
    color: "#2c2c2c",
  },
  cardSubtitle: {
    color: "#666",
    fontSize: width * 0.03,
    marginTop: 4,
  },

  uploadBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
    backgroundColor: "#f7f7f7",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    resizeMode: "cover",
  },

  label: {
    fontWeight: "600",
    marginLeft: 25,
    color: "#333",
    fontSize: width * 0.032,
    marginTop: 8,
    marginBottom: 3,
  },
  pickerContainer: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: { width: "100%", height: 45 },

  input: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },

  textArea: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 20,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  button: {
    width: width * 0.3,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: height * 0.012,
  },
  cancelBtn: { backgroundColor: "#f8d7da" },
  submitBtn: { backgroundColor: "#9dc5e3" },
  cancelText: { color: "#b94a48", fontWeight: "600" },
  submitText: { color: "#fff", fontWeight: "600" },

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
