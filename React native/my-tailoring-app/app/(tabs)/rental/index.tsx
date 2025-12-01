// app/(tabs)/rental/index.tsx
import React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const rentals = [
  {
    id: "1",
    title: "Men Suit All in Gray",
    price: 500,
    image: require("../../../assets/images/graysuit.jpg"),
  },
  {
    id: "2",
    title: "Classic Black Tuxedo",
    price: 750,
    image: require("../../../assets/images/blacktuxedo.jpg"),
  },
  {
    id: "3",
    title: "Royal Blue Coat Set",
    price: 650,
    image: require("../../../assets/images/royalblue.jpg"),
  },
  {
    id: "4",
    title: "Elegant Evening Gown",
    price: 900,
    image: require("../../../assets/images/gown.jpg"),
  },
  {
    id: "5",
    title: "Barong Tagalog Premium",
    price: 400,
    image: require("../../../assets/images/barong.jpg"),
  },
  {
    id: "6",
    title: "Formal Black Dress",
    price: 700,
    image: require("../../../assets/images/blackdress.jpg"),
  },
  {
    id: "7",
    title: "Wedding Suit Beige",
    price: 850,
    image: require("../../../assets/images/beige.jpg"),
  },
  {
    id: "8",
    title: "Traditional Filipiniana",
    price: 600,
    image: require("../../../assets/images/filipiniana.jpg"),
  },
];

export default function RentalLanding() {
  const router = useRouter();

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rent Formal Wear</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require("../../../assets/images/rent.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Why Buy When You Can Rent?</Text>
            <Text style={styles.heroSubtitle}>
              Look sharp. Save big. Return easy.
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Rentals</Text>
        </View>

        {/* Rental Grid - EXACT SAME STYLE AS HOME SCREEN */}
        <View style={styles.rentalGrid}>
          {rentals.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.rentalCard}
              activeOpacity={0.9}
              onPress={() => router.push(`/rental/${item.id}`)}
            >
              <Image
                source={item.image}
                style={styles.rentalImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                style={styles.rentalOverlay}
              />
              <View style={styles.rentalInfo}>
                <Text style={styles.rentalTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.rentalPrice}>₱{item.price}/day</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace("/home")}>
          <Ionicons name="home-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
        >
          <Ionicons name="receipt-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(tabs)/cart/Cart")}>
          <Ionicons name="cart" size={26} color="#94665B" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
        >
          <Ionicons name="person-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  hero: {
    margin: 20,
    height: 220,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#e2e8f0",
    marginTop: 6,
    fontWeight: "500",
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
  },

  // EXACT SAME RENTAL CARD STYLE AS HOME SCREEN
  rentalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  rentalCard: {
    width: width * 0.44,
    height: width * 0.58,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  rentalImage: {
    width: "100%",
    height: "100%",
  },
  rentalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  rentalInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  rentalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 18,
  },
  rentalPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fbbf24", // Golden color exactly like Home
    marginTop: 4,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 15,
  },
});
