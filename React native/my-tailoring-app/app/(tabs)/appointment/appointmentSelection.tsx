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
      iconName: "cut-outline" as const, // Scissors = sewing/repair
    },
    {
      id: "custom",
      label: "Customize Service",
      desc: "Personalize and customize",
      color: "#FFFBE3",
      iconName: "shirt-outline" as const, // Shirt = customization/tailoring
    },
    {
      id: "drycleaning",
      label: "Dry Cleaning Service",
      desc: "Professional cleaning service",
      color: "#FFE6F0",
      iconName: "water-outline" as const, // Water = cleaning
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.18 }}
      >
        {/* Header - ORIGINAL LOGO KEPT */}
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Book an Appointment</Text>
            <Text style={styles.cardSubtitle}>
              Fill in your details and select a service
            </Text>
          </View>

          {/* Services Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shirt-outline" size={22} color="#64748b" />
              <Text style={styles.sectionTitle}>Select Service Type *</Text>
            </View>

            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { backgroundColor: service.color }]}
                activeOpacity={0.8}
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
                <View style={styles.serviceIconWrapper}>
                  <Ionicons name={service.iconName} size={36} color="#1e293b" />
                </View>

                <View style={styles.serviceText}>
                  <Text style={styles.serviceTitle}>{service.label}</Text>
                  <Text style={styles.serviceDesc}>{service.desc}</Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Back Button */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.back()}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },

  // Header - Logo untouched
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.07,
    paddingBottom: height * 0.03,
  },
  logo: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b",
    flex: 1,
    marginLeft: 12,
  },

  // Card
  card: {
    marginHorizontal: width * 0.06,
    marginTop: height * 0.04,
    marginBottom: height * 0.04,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    paddingTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: width * 0.065,
    fontWeight: "800",
    color: "#1e293b",
  },
  cardSubtitle: {
    fontSize: width * 0.04,
    color: "#64748b",
    marginTop: 8,
  },

  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 8,
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  serviceText: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  serviceDesc: {
    fontSize: 13.5,
    color: "#64748b",
    marginTop: 4,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  button: {
    height: 58,
    width: width * 0.5,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#fee2e2",
    borderWidth: 2,
    borderColor: "#fca5a5",
  },
  cancelText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 15,
  },

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
