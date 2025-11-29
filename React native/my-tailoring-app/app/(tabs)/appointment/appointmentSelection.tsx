// app/(tabs)/appointment/appointmentSelection.tsx
import * as React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function AppointmentSelection() {
  const router = useRouter();

  const services = [
    {
      id: "repair",
      label: "Repair Service",
      desc: "Fix and restore your clothes",
      color: "#EAF3FF",
      icon: require("../../../assets/images/logo.png"),
    },
    {
      id: "custom",
      label: "Customize Service",
      desc: "Personalize and customize",
      color: "#FFFBE3",
      icon: require("../../../assets/images/logo.png"),
    },
    {
      id: "drycleaning",
      label: "Dry Cleaning Service",
      desc: "Professional cleaning service",
      color: "#FFE6F0",
      icon: require("../../../assets/images/logo.png"),
    },
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
          <TouchableOpacity
            style={styles.profileIcon}
            onPress={() => router.push("./profile")}
          >
            <Ionicons name="person-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Book an Appointment</Text>
            <Text style={styles.cardSubtitle}>
              Fill in your details and select a service
            </Text>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shirt-outline" size={18} color="#555" />
              <Text style={styles.sectionTitle}>Select Service Type *</Text>
            </View>

            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { backgroundColor: service.color }]}
                onPress={() => {
                  if (service.id === "custom") {
                    router.push("../appointment/CustomizeClothes");
                  } else if (service.id === "repair") {
                    router.push("../appointment/RepairClothes");
                  } else if (service.id === "drycleaning") {
                    router.push("../appointment/DryCleaning");
                  }
                }}
              >
                <Image source={service.icon} style={styles.serviceIcon} />
                <View>
                  <Text style={styles.serviceTitle}>{service.label}</Text>
                  <Text style={styles.serviceDesc}>{service.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.push("../appointment/AppointmentScreen")}
            >
              <Text style={styles.cancelText}>Back</Text>
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
    </SafeAreaView>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    marginTop: height * 0.05,
    paddingHorizontal: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: 50,
  },
  headerTitle: {
    fontWeight: "600",
    fontSize: width * 0.035,
    color: "#222",
    flex: 1,
    marginLeft: 8,
  },
  profileIcon: {
    marginLeft: 8,
  },

  card: {
    backgroundColor: "#fff",
    width: "85%",
    alignSelf: "center",
    marginTop: height * 0.08,
    marginBottom: height * 0.12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    paddingBottom: 10,
  },
  cardHeader: {
    backgroundColor: "#cfd8e4",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  cardTitle: {
    fontSize: width * 0.04,
    fontWeight: "700",
    color: "#2c2c2c",
  },
  cardSubtitle: {
    color: "#666",
    marginTop: 4,
    fontSize: width * 0.03,
  },

  section: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: width * 0.035,
    marginLeft: 6,
    color: "#333",
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: height * 0.018,
    marginBottom: height * 0.012,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  serviceIcon: {
    width: width * 0.09,
    height: width * 0.09,
    marginRight: 12,
    resizeMode: "contain",
  },
  serviceTitle: { fontWeight: "700", color: "#333" },
  serviceDesc: { color: "#777", fontSize: width * 0.03, marginTop: 2 },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: height * 0.02,
    gap: 12,
  },
  button: {
    width: width * 0.25,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: height * 0.012,
  },
  cancelBtn: { backgroundColor: "#f8d7da" },
  nextBtn: { backgroundColor: "#9dc5e3" },
  cancelText: { color: "#b94a48", fontWeight: "600" },
  nextText: { color: "#fff", fontWeight: "600" },

  // Fixed bottom nav - now safe outside ScrollView
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
