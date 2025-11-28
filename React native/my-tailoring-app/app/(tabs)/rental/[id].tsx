// app/(tabs)/rental/[id].tsx
import * as React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

// Rental items data - should match the data in home.tsx and rental/index.tsx
const rentalItems = [
  {
    id: "1",
    title: "Men Suit All in Gray",
    price: 500,
    size: "Medium",
    fabric: "Wool blend",
    color: "Gray",
    length: "Regular",
    image: require("../../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "2",
    title: "Classic Black Tuxedo",
    price: 750,
    size: "Large",
    fabric: "Premium cotton",
    color: "Black",
    length: "Regular",
    image: require("../../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "3",
    title: "Royal Blue Coat Set",
    price: 650,
    size: "Medium",
    fabric: "Polyester blend",
    color: "Royal Blue",
    length: "Regular",
    image: require("../../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "4",
    title: "Elegant Evening Gown",
    price: 900,
    size: "Small",
    fabric: "Silk",
    color: "Burgundy",
    length: "Floor length",
    image: require("../../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "5",
    title: "Barong Tagalog Premium",
    price: 400,
    size: "Medium",
    fabric: "Jusi",
    color: "Cream White",
    length: "Regular",
    image: require("../../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "6",
    title: "Formal Black Dress",
    price: 700,
    size: "Medium",
    fabric: "Crepe",
    color: "Black",
    length: "Knee length",
    image: require("../../../assets/images/tailorbackground.jpg"),
  },
];

export default function RentalDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find the item based on the ID
  const item = rentalItems.find((rental) => rental.id === id);

  // If item not found, show error
  if (!item) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 25 }}>←</Text>
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Item not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={{ fontSize: 25 }}>←</Text>
      </TouchableOpacity>

      {/* Item Image */}
      <Image source={item.image} style={styles.image} resizeMode="cover" />

      {/* Item Details Sheet */}
      <View style={styles.sheet}>
        <View style={styles.titlePill}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {item.title}
          </Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.linkRow}>📐 Size: {item.size}</Text>
          <Text style={styles.linkRow}>💲 Price: ₱ {item.price} / day</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.desc}>
            Fabric type: {item.fabric}
            {"\n"}
            Color: {item.color}
            {"\n"}
            Length: {item.length}
          </Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionLabel}>Rental Date</Text>
          <TouchableOpacity style={styles.calendarBtn}>
            <Text style={{ color: "#444" }}>📅 Select Date</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.rentBtn}
          onPress={() => {
            alert(`${item.title} rented successfully!`);
            router.push("/home");
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
              letterSpacing: 2,
              fontSize: 16,
            }}
          >
            RENT NOW
          </Text>
        </TouchableOpacity>

        <View style={styles.additionalInfo}>
          <Text style={styles.infoTitle}>Rental Information</Text>
          <Text style={styles.infoText}>• Minimum rental period: 1 day</Text>
          <Text style={styles.infoText}>• Late return fee: ₱100/day</Text>
          <Text style={styles.infoText}>• Damage deposit: ₱500</Text>
          <Text style={styles.infoText}>• Free alterations included</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backBtn: {
    position: "absolute",
    top: 28,
    left: 16,
    zIndex: 10,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 280,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  titlePill: {
    alignSelf: "center",
    backgroundColor: "#94665B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  linkRow: {
    color: "#1F2937",
    fontSize: 15,
    marginTop: 8,
    fontWeight: "500",
  },
  sectionLabel: {
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    fontSize: 16,
  },
  desc: {
    color: "#6B7280",
    lineHeight: 22,
    fontSize: 14,
  },
  calendarBtn: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rentBtn: {
    marginTop: 24,
    alignSelf: "center",
    backgroundColor: "#94665B",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  additionalInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    fontWeight: "600",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#94665B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
});
