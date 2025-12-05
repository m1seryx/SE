// app/(tabs)/rental/index.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const rentals = [
  {
    id: "1",
    title: "Men Suit All in Gray",
    price: 500,
    image: require("../../../assets/images/graysuit.jpg"),
    category: "Suit",
  },
  {
    id: "2",
    title: "Classic Black Tuxedo",
    price: 750,
    image: require("../../../assets/images/blacktuxedo.jpg"),
    category: "Suit",
  },
  {
    id: "3",
    title: "Royal Blue Coat Set",
    price: 650,
    image: require("../../../assets/images/royalblue.jpg"),
    category: "Coat",
  },
  {
    id: "4",
    title: "Elegant Evening Gown",
    price: 900,
    image: require("../../../assets/images/gown.jpg"),
    category: "Gown",
  },
  {
    id: "5",
    title: "Barong Tagalog Premium",
    price: 400,
    image: require("../../../assets/images/barong.jpg"),
    category: "Barong",
  },
  {
    id: "6",
    title: "Formal Black Dress",
    price: 700,
    image: require("../../../assets/images/blackdress.jpg"),
    category: "Gown",
  },
  {
    id: "7",
    title: "Wedding Suit Beige",
    price: 850,
    image: require("../../../assets/images/beige.jpg"),
    category: "Suit",
  },
  {
    id: "8",
    title: "Traditional Filipiniana",
    price: 600,
    image: require("../../../assets/images/filipiniana.jpg"),
    category: "Gown",
  },
];

const categories = [
  { name: "All", icon: "apps" },
  { name: "Suit", icon: "person" },
  { name: "Coat", icon: "snow" },
  { name: "Barong", icon: "leaf" },
  { name: "Gown", icon: "woman" },
  { name: "Shirt", icon: "shirt" },
  { name: "Trousers", icon: "body" },
];

export default function RentalLanding() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredRentals =
    selectedCategory === "All"
      ? rentals
      : rentals.filter((item) => item.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PREMIUM HEADER - Same as Home */}
        <View style={styles.headerSection}>
          <View style={styles.greetingRow}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.logo}
            />
            <View style={styles.brandInfo}>
              <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#78350F" />
          </TouchableOpacity>
        </View>

        {/* HERO SECTION - Same style as Home */}
        <View style={styles.heroContainer}>
          <Image
            source={require("../../../assets/images/rent.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(120,53,15,0.9)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBadge}>
            <Text style={styles.heroTitle}>Rent Premium Formal Wear</Text>
            <View style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Explore Collection</Text>
            </View>
          </View>
        </View>

        {/* CATEGORY FILTER - Premium chips with icons */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={isActive ? "#FFFFFF" : "#78350F"}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SECTION TITLE - Same as Home */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="shirt-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>
                {selectedCategory === "All"
                  ? "All Rentals"
                  : `${selectedCategory} Collection`}
              </Text>
            </View>
            <Text style={styles.itemCount}>{filteredRentals.length} items</Text>
          </View>

          {/* RENTAL GRID - EXACT SAME AS HOME */}
          <View style={styles.rentalGrid}>
            {filteredRentals.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.rentalCard}
                activeOpacity={0.88}
                onPress={() => router.push(`/rental/${item.id}`)}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={item.image}
                    style={styles.rentalImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
                <View style={styles.rentalInfoOverlay}>
                  <Text style={styles.rentalTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.rentalPrice}>₱{item.price}</Text>
                    <Text style={styles.priceLabel}>/3 days</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM NAV - Same as Home (Rental tab active) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          style={styles.navItemWrap}
        >
          <Ionicons name="home-outline" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
          style={styles.navItemWrap}
        >
          <Ionicons name="calendar-outline" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Book</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/cart/Cart")}
          style={styles.navItemWrap}
        >
          <Ionicons name="cart-outline" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
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
  container: { flex: 1, backgroundColor: "#FAFAF9" },

  // Header - Same as Home
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F4",
  },
  greetingRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  logo: { width: 44, height: 44, borderRadius: 22 },
  brandInfo: { marginLeft: 12 },
  headerTitle: { fontWeight: "700", fontSize: 16, color: "#0F172A" },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // Hero - Same premium feel
  heroContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    height: height * 0.26,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 18,
  },
  heroImage: { width: "100%", height: "100%" },
  heroBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 16,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FDE68A",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  heroButtonText: { color: "#78350F", fontSize: 15, fontWeight: "700" },

  // Category Chips
  categorySection: { paddingVertical: 16, backgroundColor: "#FAFAF9" },
  categoryScroll: { paddingHorizontal: 20, gap: 14 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryChipActive: {
    backgroundColor: "#78350F",
    borderColor: "#78350F",
  },
  categoryText: { fontSize: 15, fontWeight: "700", color: "#78350F" },
  categoryTextActive: { color: "#FFFFFF" },

  // Section Styling - Same as Home
  sectionContainer: { marginTop: 36, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  itemCount: { fontSize: 15, color: "#64748B", fontWeight: "600" },

  // Rental Cards - 100% SAME AS HOME
  rentalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  rentalCard: {
    width: (width - 40 - 32) / 2,
    height: 200,
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  imageWrapper: { width: "100%", height: "100%" },
  rentalImage: { width: "100%", height: "100%" },
  rentalInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
  },
  rentalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 20,
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  rentalPrice: { fontSize: 20, fontWeight: "900", color: "#F59E0B" },
  priceLabel: { fontSize: 12, color: "#CBD5E1", fontWeight: "600" },

  // Bottom Nav - Rental tab active
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
    elevation: 20,
  },
  navItemWrap: { alignItems: "center", gap: 4 },
  navItemWrapActive: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    gap: 4,
  },
  navLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  navLabelActive: { fontSize: 11, color: "#78350F", fontWeight: "700" },
});
