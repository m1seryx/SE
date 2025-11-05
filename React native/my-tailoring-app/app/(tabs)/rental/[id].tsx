import * as React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function RentalDetail() {
  const router = useRouter();
  const { id, title, price } = useLocalSearchParams<{ id: string; title?: string; price?: string }>();

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={{ fontSize: 25 }}>←</Text>
      </TouchableOpacity>

      {/* Image */}
      <Image
        source={require("../../../assets/images/tailorbackground.jpg")}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Curved top card */}
      <View style={styles.sheet}>
        <View style={styles.titlePill}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{title ?? "Men Suit All in Gray"}</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.linkRow}>🧷  Size: 30</Text>
          <Text style={styles.linkRow}>💲  Price: {price ? `₱ ${price}` : "₱ 500"}</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.desc}>Fabric type: Cotton Fabric{"\n"}Color: Gray{ "\n" }Length: 20</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionLabel}>Date</Text>
          <TouchableOpacity style={styles.calendarBtn}>
            <Text style={{ color: "#444" }}>Calendar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.rentBtn} 
          onPress={() => router.replace("/(tabs)/appointment/AppointmentScreen")}
        > 
          <Text style={{ color: "#fff", fontWeight: "800", letterSpacing: 2 }}>RENT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  backBtn: { position: "absolute", top: 28, left: 16, zIndex: 10, backgroundColor: "#fff", padding: 8, borderRadius: 20 },
  image: { width: "100%", height: 230 },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titlePill: { alignSelf: "center", backgroundColor: "#6B3F3F", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  linkRow: { color: "#1E3A8A", textDecorationLine: "underline", marginTop: 8 },
  sectionLabel: { fontWeight: "700", color: "#111", marginBottom: 8 },
  desc: { color: "#444", lineHeight: 20 },
  calendarBtn: { backgroundColor: "#E9E9EA", alignItems: "center", paddingVertical: 12, borderRadius: 8 },
  rentBtn: { marginTop: 18, alignSelf: "center", backgroundColor: "#2E7D32", paddingVertical: 12, paddingHorizontal: 36, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6 },
});


