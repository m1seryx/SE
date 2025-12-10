// app/(tabs)/rental/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { rentalService } from "../../../utils/rentalService";

const { width, height } = Dimensions.get("window");

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch rentals on mount
  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const result = await rentalService.getAvailableRentals();
      console.log('Rentals fetched:', result);
      
      if (result.items && result.items.length > 0) {
        setRentals(result.items);
      } else {
        setError('No rental items available');
      }
    } catch (err) {
      console.error('Error fetching rentals:', err);
      setError('Failed to load rental items');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchRentals(true);
  };

  const getImageSource = (item: any) => {
    if (item.image_url) {
      const imageUrl = rentalService.getImageUrl(item.image_url);
      if (imageUrl) {
        return { uri: imageUrl };
      }
    }
    // Fallback to placeholder
    return require("../../../assets/images/rent.jpg");
  };

  // Filter rentals based on selected category
  const filteredRentals =
    selectedCategory === "All"
      ? rentals
      : rentals.filter((item) => {
          const category = item.category || item.item_category || "Other";
          return category === selectedCategory;
        });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* PREMIUM HEADER */}
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

        {/* HERO SECTION */}
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

        {/* CATEGORY FILTER */}
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

        {/* SECTION TITLE */}
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

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#94665B" />
            <Text style={styles.loadingText}>Loading rentals...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchRentals()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRentals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No rentals in this category</Text>
          </View>
        ) : (
          /* RENTAL GRID */
          <View style={styles.rentalGrid}>
            {filteredRentals.map((item) => (
              <TouchableOpacity
                key={item.item_id}
                style={styles.rentalCard}
                activeOpacity={0.88}
                onPress={() => router.push(`/(tabs)/rental/${item.item_id}`)}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={getImageSource(item)}
                    style={styles.rentalImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.6)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
                <View style={styles.rentalInfoOverlay}>
                  <Text style={styles.rentalTitle} numberOfLines={2}>
                    {item.item_name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.rentalPrice}>₱{item.daily_rate}</Text>
                    <Text style={styles.priceLabel}>/day</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity onPress={() => router.replace("/home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
        >
          <View style={styles.navItemWrap}>
            <Ionicons name="receipt-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(tabs)/cart/Cart")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="cart-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
        >
          <View style={styles.navItemWrap}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
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

  // Rental Cards - Premium Design
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

  // Loading & Error States
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#94665B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9CA3AF",
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
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
