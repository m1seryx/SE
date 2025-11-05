import * as React from "react";
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, Platform } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const services = [
  { id: "s1", label: "Rental", icon: require("../../assets/images/android-icon-foreground.png") },
  { id: "s2", label: "Customize", icon: require("../../assets/images/icon.png") },
  { id: "s3", label: "Repair", icon: require("../../assets/images/android-icon-monochrome.png") },
];

// Added more rental items
const rentals = [
  {
    id: "1",
    title: "Men Suit All in Gray",
    price: 500,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "2",
    title: "Classic Black Tuxedo",
    price: 750,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "3",
    title: "Royal Blue Coat Set",
    price: 650,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "4",
    title: "Elegant Evening Gown",
    price: 900,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "5",
    title: "Barong Tagalog Premium",
    price: 400,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "6",
    title: "Formal Black Dress",
    price: 700,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "7",
    title: "Wedding Suit Beige",
    price: 850,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
  {
    id: "8",
    title: "Traditional Filipiniana",
    price: 600,
    image: require("../../assets/images/tailorbackground.jpg"),
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/tailorbackground.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroBadge}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Welcome to Jackman Tailor Deluxe!</Text>
          <Text style={{ color: "#f0f0f0", marginTop: 2 }}>Your perfect fit awaits.</Text>
        </View>
      </View>

      {/* SERVICES */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Jackman's Services</Text>
      </View>
      <View style={styles.servicesRow}>
        {services.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.serviceCard}
            onPress={() => {
              if (s.id === "s1") router.push("../rental");
              else if (s.id === "s2") router.push("/(tabs)/appointment/CustomizeClothes");
              else if (s.id === "s3") router.push("/(tabs)/appointment/RepairClothes");
            }}
          >
            <Image source={s.icon} style={{ width: 44, height: 44, borderRadius: 12 }} />
            <Text style={styles.serviceText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* RENTALS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Rental Clothes</Text>
        <TouchableOpacity onPress={() => router.push("../rental")}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {rentals.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.itemCard}
            onPress={() => router.push("../rental")}
          >
            <Image source={r.image} style={styles.itemImage} />
            <View style={{ padding: 8 }}>
              <Text style={styles.itemTitle}>{r.title}</Text>
              <Text style={styles.itemPrice}>₱ {r.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* FIXED BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <View style={styles.navItemWrapActive}>
          <Ionicons name="home" size={20} color="#7A5A00" />
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/appointment/AppointmentScreen")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="receipt-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <View style={styles.navItemWrap} pointerEvents="none">
          <Ionicons name="cart-outline" size={20} color="#9CA3AF" />
        </View>
        <View style={styles.navItemWrap} pointerEvents="none">
          <Ionicons name="person-outline" size={20} color="#9CA3AF" />
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },
  hero: {
    margin: 16,
    marginTop: Platform.OS === "android" ? 16 : 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: height * 0.2,
  },
  heroBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(30,58,138,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sectionHeaderRow: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  seeAll: {
    color: "#6B7280",
  },
  servicesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
  },
  serviceCard: {
    width: "32%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  serviceText: {
    marginTop: 6,
    color: "#374151",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
  },
  itemCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  itemImage: {
    width: "100%",
    height: 110,
  },
  itemTitle: {
    fontWeight: "700",
    color: "#1F2937",
  },
  itemPrice: {
    color: "#6B7280",
    marginTop: 2,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: height * 0.018,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: "absolute",
    bottom: 0,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  navItemWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  navItemWrapActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDE68A",
  },
});
