import * as React from "react";
import {View,StyleSheet,Image,TouchableOpacity,ScrollView,Dimensions,SafeAreaView,} from "react-native";
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
      id: "rental",
      label: "Rental Service",
      desc: "Rent your preferred clothes",
      color: "#E6FBE6",
      icon: require("../../../assets/images/logo.png"),
    },
    {
      id: "custom",
      label: "Customize Service",
      desc: "Personalize and customize",
      color: "#FFFBE3",
      icon: require("../../../assets/images/logo.png"),
    },
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
            <Text style={styles.cardTitle}>Book an Appointment</Text>
            <Text style={styles.cardSubtitle}>
              Fill in your details and select a service
            </Text>
          </View>

          
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
        router.push("../appointment/RepairClothes"); // optional future page
      } else if (service.id === "rental") {
        router.push("../rental/index"); // optional future page
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

          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => router.push("../appointment/AppointmentScreen")}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.nextBtn]}
              onPress={() => router.push("../appointment/AppointmentScreen")}
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("../home")}>
          <View style={styles.navItem}>
            <Ionicons name="home-outline" size={20} color="#777" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("../appointment")}>
          <View style={[styles.navItem, styles.activeNav]}>
            <Ionicons name="receipt-outline" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity>
          <View style={styles.navItem}>
            <Ionicons name="cart-outline" size={20} color="#777" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity>
          <View style={styles.navItem}>
            <Ionicons name="person-outline" size={20} color="#777" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  navItem: {
    backgroundColor: "#eaeaea",
    borderRadius: 20,
    padding: width * 0.025,
  },
  activeNav: { backgroundColor: "#b69e64" },
});
