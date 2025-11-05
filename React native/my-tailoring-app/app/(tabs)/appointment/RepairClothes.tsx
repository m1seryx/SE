import React, { useState } from "react";
import {View,Text,StyleSheet,TouchableOpacity,TextInput,Image,ScrollView,Dimensions,SafeAreaView,
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
        contentContainerStyle={{ paddingBottom: height * 0.12 }}
      >
        
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

       
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Repair</Text>
            <Text style={styles.cardSubtitle}>Fill in your details</Text>
          </View>

          
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

         
          <Text style={styles.label}>Type of Item</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedItem}
              onValueChange={(value) => setSelectedItem(value)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select garment (pants, suit, dress, uniform...)"
                value=""
              />
              {itemTypes.map((item, index) => (
                <Picker.Item label={item} value={item} key={index} />
              ))}
            </Picker>
          </View>

          
          <Text style={styles.label}>Damage Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={damageType}
              onValueChange={(value) => setDamageType(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select type of damage" value="" />
              {damageOptions.map((damage, index) => (
                <Picker.Item label={damage} value={damage} key={index} />
              ))}
            </Picker>
          </View>

        
          <Text style={styles.label}>Repair Instruction</Text>
          <TextInput
            placeholder="Describe what you want the tailor to do..."
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={instruction}
            onChangeText={setInstruction}
          />

          
          <View style={styles.buttonRow}>
 <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.push("../appointment/appointmentSelection")}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.repairBtn]}
              onPress={() => alert("Repair request submitted!")}
            >
              <Text style={styles.repairText}>Repair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("../home")}>
          <Ionicons name="home-outline" size={22} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("../appointment")}>
          <Ionicons name="receipt-outline" size={22} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="cart-outline" size={22} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="person-outline" size={22} color="#777" />
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
  repairBtn: { backgroundColor: "#9dc5e3" },
  cancelText: { color: "#b94a48", fontWeight: "600" },
  repairText: { color: "#fff", fontWeight: "600" },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f5f5f5",
    paddingVertical: height * 0.015,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: "absolute",
    bottom: height * 0.015,
    width: "55%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
  },
});
