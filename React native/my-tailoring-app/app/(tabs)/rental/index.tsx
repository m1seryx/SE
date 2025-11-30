import * as React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions, // ← Added this!
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window"); // ← Now defined!

const rentals = Array.from({ length: 6 }).map((_, i) => ({
  id: String(i + 1),
  title: `Clothes ${i + 1}`,
  image: require("../../../assets/images/tailorbackground.jpg"),
}));

const productIcons = [
  require("../../../assets/images/android-icon-foreground.png"),
  require("../../../assets/images/icon.png"),
  require("../../../assets/images/android-icon-monochrome.png"),
  require("../../../assets/images/favicon.png"),
];

export default function RentalLanding() {
  const router = useRouter();

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }} // Space for bottom nav
      >
        <View style={styles.topBar}>
          <Text style={{ fontWeight: "700", color: "#111" }}>
            Jackman Tailor Deluxe
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/home")}
            style={styles.closeBtn}
          >
            <Text style={{ fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image
            source={require("../../../assets/images/tailorbackground.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroBadgeRight}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
              Why Buy?
            </Text>
            <Text style={{ color: "#fff", marginTop: 2 }}>
              Just Rent the Vibe.
            </Text>
            <Text style={{ color: "#e6e6e6", marginTop: 6, fontSize: 12 }}>
              Rent it. Rock it. Return it.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Products</Text>
        <View style={styles.productsRow}>
          {productIcons.map((img, i) => (
            <View key={i} style={styles.productChip}>
              <Image source={img} style={styles.productIconImg} />
              <Text style={styles.productLabel}>
                {["Slacks", "Shirts", "Suits", "Jackets"][i] || "Item"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Rental Clothes</Text>
        <View style={styles.grid}>
          {rentals.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.itemCard}
              onPress={() =>
                router.push({
                  pathname: "/rental/[id]",
                  params: { id: r.id },
                })
              }
            >
              <Image source={r.image} style={styles.itemImage} />
              <View style={{ padding: 8, alignItems: "center" }}>
                <Text style={styles.itemTitle}>{r.title}</Text>
                <View style={styles.viewBtn}>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>View</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Now outside ScrollView & properly positioned */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace("/home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home" size={24} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <View style={styles.navItemWrap}>
          <Ionicons name="receipt-outline" size={24} color="#9CA3AF" />
        </View>

        <View style={styles.navItemWrap}>
          <Ionicons name="cart-outline" size={24} color="#9CA3AF" />
        </View>

        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  emptyState: { padding: 40, alignItems: "center" },
  container: { flex: 1, backgroundColor: "#F7F7F8" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  hero: { margin: 16, borderRadius: 16, overflow: "hidden" },
  heroImage: { width: "100%", height: 180 },
  heroBadgeRight: {
    position: "absolute",
    right: 12,
    top: 16,
    backgroundColor: "rgba(17,24,39,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  productsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
  },
  productChip: { marginRight: 16, alignItems: "center" },
  productIconImg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    resizeMode: "cover",
  },
  productLabel: { marginTop: 6, fontSize: 12, color: "#6B7280" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
  },
  itemCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEE",
    elevation: 2,
  },
  itemImage: { width: "100%", height: 120 },
  itemTitle: { fontWeight: "700", color: "#1F2937", fontSize: 14 },
  viewBtn: {
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

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
