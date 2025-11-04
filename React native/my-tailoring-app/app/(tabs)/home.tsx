import * as React from "react";
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const services = [
  { id: "s1", label: "Rental", icon: require("../../assets/images/android-icon-foreground.png") },
  { id: "s2", label: "Customize", icon: require("../../assets/images/icon.png") },
  { id: "s3", label: "Repair", icon: require("../../assets/images/android-icon-monochrome.png") },
];

const rentals = Array.from({ length: 9 }).map((_, i) => ({
  id: String(i + 1),
  title: `Men Suit All in Gray`,
  price: 500,
  image: require("../../assets/images/tailorbackground.jpg"),
}));

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Hero banner */}
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

      {/* Services */}
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
            }}
          >
            <Image source={s.icon} style={{ width: 44, height: 44, borderRadius: 12 }} />
            <Text style={styles.serviceText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rentals grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Rental Clothes</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {rentals.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.itemCard}
            onPress={() => router.push({ pathname: "/rental/[id]", params: { id: r.id, title: r.title, price: String(r.price) } })}
          >
            <Image source={r.image} style={styles.itemImage} />
            <View style={{ padding: 8 }}>
              <Text style={styles.itemTitle}>{r.title}</Text>
              <Text style={styles.itemPrice}>₱ {r.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Floating bottom nav with icons (Home active) */}
      <View style={styles.fakeBottomNav}>
        <View style={styles.navItemWrapActive}>
          <Ionicons name="home" size={18} color="#7A5A00" />
        </View>
        <TouchableOpacity onPress={() => router.push("../rental")}>
          <View style={styles.navItemWrap}><Ionicons name="receipt-outline" size={18} color="#9CA3AF" /></View>
        </TouchableOpacity>
        <View style={styles.navItemWrap}><Ionicons name="cart-outline" size={18} color="#9CA3AF" /></View>
        <View style={styles.navItemWrap}><Ionicons name="person-outline" size={18} color="#9CA3AF" /></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },
  hero: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 150,
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
  fakeBottomNav: { marginTop: 12, alignSelf: "center", backgroundColor: "#F3F4F6", borderRadius: 24, flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  navItemWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginHorizontal: 8, backgroundColor: "#E5E7EB" },
  navItemWrapActive: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginHorizontal: 8, backgroundColor: "#FDE68A" },
});
