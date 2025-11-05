import * as React from "react";
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, Platform } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const rentals = Array.from({ length: 6 }).map((_, i) => ({
  id: String(i + 1),
  title: `Clothes ${i + 1}`,
  image: require("../../../assets/images/tailorbackground.jpg"),
}));

export default function RentalLanding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Header bar with title and close */}
      <View style={styles.topBar}>
        <Text style={{ fontWeight: "700", color: "#111" }}>Jackman Tailor Deluxe</Text>
        <TouchableOpacity onPress={() => router.replace("/home")} style={styles.closeBtn}>
          <Text style={{ fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.hero}>
        <Image
          source={require("../../../assets/images/tailorbackground.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroBadgeRight}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Why Buy?</Text>
          <Text style={{ color: "#fff", marginTop: 2 }}>Just Rent the Vibe.</Text>
          <Text style={{ color: "#e6e6e6", marginTop: 6, fontSize: 12 }}>Rent it. Rock it. Return it.</Text>
        </View>
      </View>

      {/* Products row */}
      <Text style={styles.sectionTitle}>Products</Text>
      <View style={styles.productsRow}>
        {[require("../../../assets/images/android-icon-foreground.png"), require("../../../assets/images/icon.png"), require("../../../assets/images/android-icon-monochrome.png"), require("../../../assets/images/favicon.png")] .map((img, i) => (
          <View key={i} style={styles.productChip}>
            <Image source={img} style={styles.productIconImg} />
            <Text style={styles.productLabel}>Slacks</Text>
          </View>
        ))}
      </View>

      {/* Rental Clothes grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Rental Clothes</Text>
      </View>
      <View style={styles.grid}>
        {rentals.map((r) => (
          <TouchableOpacity key={r.id} style={styles.itemCard} onPress={() => router.push({ pathname: "/rental/[id]", params: { id: r.id } })}>
            <Image source={r.image} style={styles.itemImage} />
            <View style={{ padding: 8, alignItems: "center" }}>
              <Text style={styles.itemTitle}>{r.title}</Text>
              <View style={styles.viewBtn}><Text style={{ fontSize: 12, color: "#6B7280" }}>View</Text></View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* FIXED BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace('/home')}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/appointment/AppointmentScreen")}>
          <View style={styles.navItemWrapActive}>
            <Ionicons name="receipt-outline" size={20} color="#7A5A00" />
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
  container: { flex: 1, backgroundColor: "#F7F7F8" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 12 : 24, paddingBottom: 4 },
  closeBtn: { padding: 8, backgroundColor: "#fff", borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  hero: { margin: 16, borderRadius: 16, overflow: "hidden" },
  heroImage: { width: "100%", height: height * 0.2 },
  heroBadgeRight: { position: "absolute", right: 12, top: 16, backgroundColor: "rgba(17,24,39,0.55)", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  sectionHeaderRow: { marginTop: 8, marginHorizontal: 16, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { marginHorizontal: 16, marginTop: 8, fontSize: 16, fontWeight: "700", color: "#222" },
  productsRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 10 },
  productChip: { marginRight: 12, alignItems: "center" },
  productIcon: { width: 60, height: 60, borderRadius: 14, backgroundColor: "#EEE" },
  productIconImg: { width: 60, height: 60, borderRadius: 14, resizeMode: "cover" },
  productLabel: { marginTop: 6, fontSize: 12, color: "#6B7280" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginHorizontal: 16, marginTop: 12 },
  itemCard: { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 14, marginBottom: 12, overflow: "hidden", borderWidth: 1, borderColor: "#EEE" },
  itemImage: { width: "100%", height: 110 },
  itemTitle: { fontWeight: "700", color: "#1F2937" },
  viewBtn: { marginTop: 6, backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
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


