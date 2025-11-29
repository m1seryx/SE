import * as React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { height, width } = Dimensions.get("window");

const services = [
  {
    id: "s1",
    label: "Rental",
    icon: require("../../assets/images/rental.jpg"),
  },
  {
    id: "s2",
    label: "Customize",
    icon: require("../../assets/images/customize.jpg"),
  },
  {
    id: "s3",
    label: "Repair",
    icon: require("../../assets/images/repair.jpg"),
  },
  {
    id: "s4",
    label: "Dry Cleaning",
    icon: require("../../assets/images/dry.jpg"),
  },
];

const rentals = [
  {
    id: "1",
    title: "Men Suit All in Gray",
    price: 500,
    image: require("../../assets/images/graysuit.jpg"),
  },
  {
    id: "2",
    title: "Classic Black Tuxedo",
    price: 750,
    image: require("../../assets/images/blacktuxedo.jpg"),
  },
  {
    id: "3",
    title: "Royal Blue Coat Set",
    price: 650,
    image: require("../../assets/images/royalblue.jpg"),
  },
  {
    id: "4",
    title: "Elegant Evening Gown",
    price: 900,
    image: require("../../assets/images/gown.jpg"),
  },
  {
    id: "5",
    title: "Barong Tagalog Premium",
    price: 400,
    image: require("../../assets/images/barong.jpg"),
  },
  {
    id: "6",
    title: "Formal Black Dress",
    price: 700,
    image: require("../../assets/images/blackdress.jpg"),
  },
  {
    id: "7",
    title: "Wedding Suit Beige",
    price: 850,
    image: require("../../assets/images/beige.jpg"),
  },
  {
    id: "8",
    title: "Traditional Filipiniana",
    price: 600,
    image: require("../../assets/images/filipiniana.jpg"),
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome + Hero */}
        <View style={styles.headerSection}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>

          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="notifications-outline" size={25} color="black" />{" "}
          </TouchableOpacity>
        </View>

        <View style={styles.heroContainer}>
          <Image
            source={require("../../assets/images/tailorbackground.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBadge}>
            <Text style={styles.heroTitle}>Jackman Tailor Deluxe</Text>
            <Text style={styles.heroSubtitle}>Your perfect fit awaits.</Text>
          </View>
        </View>

        {/* Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <Ionicons name="cut-outline" size={24} color="#991b1b" />
        </View>

        <View style={styles.servicesGrid}>
          {services.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.serviceCard}
              activeOpacity={0.85}
              onPress={() => {
                if (s.id === "s1") router.push("/rental");
                else if (s.id === "s2")
                  router.push("/(tabs)/appointment/CustomizeClothes");
                else if (s.id === "s3")
                  router.push("/(tabs)/appointment/RepairClothes");
                else if (s.id === "s4")
                  router.push("/(tabs)/appointment/DryCleaning");
              }}
            >
              <LinearGradient
                colors={["rgba(153,27,27,0.08)", "rgba(153,27,27,0.04)"]}
                style={styles.serviceGradient}
              />
              <Image
                source={s.icon}
                style={styles.serviceImage}
                resizeMode="cover"
              />
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Rentals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rentals</Text>
          <TouchableOpacity onPress={() => router.push("/rental")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rentalGrid}>
          {rentals.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.rentalCard}
              activeOpacity={0.9}
              onPress={() => router.push(`/rental/${r.id}`)}
            >
              <Image
                source={r.image}
                style={styles.rentalImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                style={styles.rentalOverlay}
              />
              <View style={styles.rentalInfo}>
                <Text style={styles.rentalTitle} numberOfLines={2}>
                  {r.title}
                </Text>
                <Text style={styles.rentalPrice}>₱{r.price}/day</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Untouched */}
      <View style={styles.bottomNav}>
        <View style={styles.navItemWrapActive}>
          <Ionicons name="home" size={20} color="#7A5A00" />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/appointment/AppointmentScreen")}
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

        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },

  headerTitle: {
    fontWeight: "600",
    fontSize: width * 0.035,
    color: "#222",
    flex: 1,
    marginLeft: 8,
  },
  // Header
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 12,
  },

  greetingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
  },

  welcomeText: {
    fontSize: 18,
    color: "#64748b",
    fontWeight: "500",
  },

  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginLeft: 6,
    letterSpacing: -0.5,
  },

  profileIcon: {
    padding: 4,
  },

  // Hero
  heroContainer: {
    margin: 20,
    height: height * 0.26,
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
  heroBadge: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
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

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
  },
  seeAll: {
    fontSize: 15,
    color: "#991b1b",
    fontWeight: "600",
  },

  // Services Grid
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  serviceCard: {
    width: width * 0.44,
    height: width * 0.44,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(153,27,27,0.12)",
    shadowColor: "#991b1b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  serviceGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
    opacity: 0.92,
  },
  serviceLabel: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Rental Grid
  rentalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
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
    color: "#fbbf24",
    marginTop: 4,
  },

  // Bottom Nav - UNTOUCHED
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
