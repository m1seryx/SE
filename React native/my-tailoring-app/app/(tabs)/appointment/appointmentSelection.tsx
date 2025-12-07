import * as React from "react";
import { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import CustomizationModal from "./CustomizationModal";

const { width, height } = Dimensions.get("window");

export default function AppointmentSelection() {
  const router = useRouter();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  const services = [
    {
      id: "repair",
      label: "Repair Service",
      desc: "Expert restoration & stitching",
      gradient: ["#DBEAFE", "#BFDBFE"],
      shadowColor: "#3B82F6",
      icon: "cut-outline" as const,
    },
    {
      id: "custom",
      label: "Customize Service",
      desc: "Tailor-made designs just for you",
      gradient: ["#FEF3C7", "#FDE68A"],
      shadowColor: "#F59E0B",
      icon: "shirt-outline" as const,
    },
    {
      id: "drycleaning",
      label: "Dry Cleaning",
      desc: "Premium care & deep clean",
      gradient: ["#FCE7F3", "#FBCFE8"],
      shadowColor: "#EC4899",
      icon: "water-outline" as const,
    },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.2 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Elegant Header */}
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
        </View>

        {/* Hero Title Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Book an Appointment</Text>
          <Text style={styles.heroSubtitle}>
            Select your desired tailoring service
          </Text>
          <View style={styles.decorativeLine} />
        </View>

        {/* Service Cards - GORGEOUS */}
        <View style={styles.servicesContainer}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.92}
              onPress={() => {
                if (service.id === "custom")
                  setShowCustomizationModal(true);
                else if (service.id === "repair")
                  router.push("../appointment/RepairClothes");
                else if (service.id === "drycleaning")
                  router.push("../appointment/DryCleaning");
              }}
            >
              <LinearGradient
                colors={service.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.serviceCard}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { shadowColor: service.shadowColor },
                  ]}
                >
                  <Ionicons
                    name={service.icon as any}
                    size={40}
                    color="#1e293b"
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle}>{service.label}</Text>
                  <Text style={styles.serviceDesc}>{service.desc}</Text>
                </View>

                <View style={styles.chevronCircle}>
                  <Ionicons name="chevron-forward" size={26} color="#64748b" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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

      {/* Customization Modal */}
      <CustomizationModal
        visible={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fafafa" },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.08,
    paddingBottom: 20,
  },
  logo: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1e293b",
    marginLeft: 14,
    letterSpacing: 0.5,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: width * 0.06,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    paddingVertical: 40,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  heroTitle: {
    fontSize: width * 0.08,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
    fontWeight: "500",
  },
  decorativeLine: {
    width: 80,
    height: 5,
    backgroundColor: "#F59E0B",
    borderRadius: 3,
    marginTop: 20,
  },

  // Services
  servicesContainer: {
    paddingHorizontal: width * 0.06,
    marginTop: 32,
    gap: 20,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 18,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 20,
  },
  serviceTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.3,
  },
  serviceDesc: {
    fontSize: 14.5,
    color: "#475569",
    marginTop: 6,
    fontWeight: "600",
  },
  chevronCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

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
  cartBadgeContainer: {
    position: "relative",
  },
});
