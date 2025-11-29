// app/orders/[id].tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// Full mock data with timeline, images, measurements
const mockOrders = [
  {
    id: "1",
    orderNo: "ORD-2024-001",
    service: "Customization",
    item: "Barong Tagalog",
    date: "Nov 25, 2024",
    status: "In Progress" as const,
    price: 2500,
    description:
      "Custom embroidery with gold thread and traditional Filipino design. Premium piña fabric with hand-stitched details.",
    estimatedCompletion: "Dec 5, 2024",
    measurements: {
      chest: "42 in",
      waist: "36 in",
      shoulder: "18 in",
      sleeve: "25 in",
      length: "30 in",
    },
    images: [
      "https://image.pollinations.ai/prompt/ultra-realistic%20barong%20tagalog%20with%20gold%20embroidery%20on%20mannequin,%20studio%20lighting,%20white%20background?width=1024&height=1024",
    ],
    timeline: [
      { status: "Order Placed", date: "Nov 25, 2024", completed: true },
      { status: "Measurement Taken", date: "Nov 26, 2024", completed: true },
      { status: "Fabric Cutting", date: "Nov 28, 2024", completed: true },
      { status: "In Stitching", date: "In Progress", completed: true },
      { status: "Quality Check", date: "Pending", completed: false },
      { status: "Ready for Pickup", date: "Dec 5, 2024", completed: false },
    ],
  },
  {
    id: "2",
    orderNo: "ORD-2024-002",
    service: "Rental",
    item: "Black Tuxedo Set",
    date: "Nov 20, 2024",
    status: "Completed" as const,
    price: 800,
    description:
      "3-piece black tuxedo rental for wedding event. Includes jacket, pants, and bow tie.",
    images: [
      "https://image.pollinations.ai/prompt/photorealistic%20black%20tuxedo%20on%20mannequin,%20elegant%20studio%20photo,%20white%20background?width=1024&height=1024",
    ],
    timeline: [
      { status: "Order Placed", date: "Nov 20, 2024", completed: true },
      { status: "Picked Up", date: "Nov 22, 2024", completed: true },
      { status: "Returned", date: "Nov 25, 2024", completed: true },
      { status: "Cleaned & Stored", date: "Nov 26, 2024", completed: true },
    ],
  },
  {
    id: "3",
    orderNo: "ORD-2024-003",
    service: "Repair",
    item: "Dress Pants",
    date: "Nov 18, 2024",
    status: "To Pick up" as const,
    price: 350,
    description: "Hem adjustment, zipper replacement, and waist alteration.",
    images: [
      "https://image.pollinations.ai/prompt/close-up%20of%20dress%20pants%20hem%20and%20zipper%20repair,%20professional%20tailoring?width=1024&height=1024",
    ],
    timeline: [
      { status: "Received", date: "Nov 18, 2024", completed: true },
      { status: "Repair Completed", date: "Nov 28, 2024", completed: true },
      { status: "Ready for Pickup", date: "Today", completed: true },
    ],
  },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = mockOrders.find((o) => o.id === id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "#3B82F6";
      case "Completed":
        return "#10B981";
      case "To Pick up":
        return "#F59E0B";
      case "Cancelled":
        return "#EF4444";
      case "Pending":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={80} color="#DC2626" />
          <Text style={styles.notFoundTitle}>Order Not Found</Text>
          <Text style={styles.notFoundText}>
            The order you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity>
          <Ionicons name="share-social-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }} // ← THIS FIXES THE OVERLAP
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.orderNo}>{order.orderNo}</Text>
              <Text style={styles.orderDate}>Placed on {order.date}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + "20" },
              ]}
            >
              <Ionicons
                name={
                  order.status === "In Progress"
                    ? "time-outline"
                    : order.status === "Completed"
                    ? "checkmark-circle"
                    : order.status === "To Pick up"
                    ? "basket"
                    : "hourglass-outline"
                }
                size={18}
                color={getStatusColor(order.status)}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {order.status}
              </Text>
            </View>
          </View>

          <View style={styles.serviceRow}>
            <View style={styles.serviceIcon}>
              <Ionicons
                name={
                  order.service === "Customization"
                    ? "shirt"
                    : order.service === "Rental"
                    ? "business"
                    : order.service === "Repair"
                    ? "construct"
                    : "water"
                }
                size={36}
                color="#94665B"
              />
            </View>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceType}>{order.service}</Text>
              <Text style={styles.itemName}>{order.item}</Text>
            </View>
            <Text style={styles.price}>₱{order.price.toLocaleString()}</Text>
          </View>
        </View>

        {/* AI Preview */}
        {order.images?.[0] && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Design Preview</Text>
            <Image
              source={{ uri: order.images[0] }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{order.description}</Text>
        </View>

        {/* Measurements */}
        {order.service === "Customization" && order.measurements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Measurements</Text>
            <View style={styles.measurementsGrid}>
              {Object.entries(order.measurements).map(([key, value]) => (
                <View key={key} style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>
                    {key.charAt(0).toUpperCase() +
                      key.slice(1).replace(/([A-Z])/g, " $1")}
                  </Text>
                  <Text style={styles.measurementValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation – Fixed at bottom */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <Ionicons name="home-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/appointment/AppointmentScreen")}
        >
          <Ionicons name="receipt-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(tabs)/cart/Cart")}>
          <Ionicons name="cart-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
        >
          <Ionicons name="person-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 21, fontWeight: "700", color: "#1F2937" },

  summaryCard: {
    backgroundColor: "#fff",
    margin: 20,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNo: { fontSize: 19, fontWeight: "700", color: "#1F2937" },
  orderDate: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: { fontSize: 14, fontWeight: "600" },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDF4F0",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceDetails: { flex: 1 },
  serviceType: { fontSize: 15, fontWeight: "700", color: "#94665B" },
  itemName: {
    fontSize: 19,
    fontWeight: "600",
    color: "#1F2937",
    marginVertical: 4,
  },
  price: { fontSize: 28, fontWeight: "800", color: "#94665B" },

  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 420,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  description: { fontSize: 15.5, color: "#4B5563", lineHeight: 23 },

  measurementsGrid: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  measurementItem: { width: "48%", marginBottom: 16 },
  measurementLabel: { fontSize: 14, color: "#6B7280" },
  measurementValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 4,
  },

  timeline: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  timelineItem: { flexDirection: "row", marginBottom: 24 },
  timelineDotContainer: {
    width: 40,
    alignItems: "center",
    position: "relative",
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E5E7EB",
    zIndex: 1,
  },
  timelineDotActive: { backgroundColor: "#94665B" },
  timelineLine: {
    position: "absolute",
    top: 22,
    bottom: -24,
    width: 3,
    backgroundColor: "#E5E7EB",
    left: 8.5,
  },
  timelineContent: { flex: 1, marginLeft: 16 },
  timelineStatus: { fontSize: 15.5, fontWeight: "600", color: "#6B7280" },
  timelineStatusActive: { color: "#1F2937" },
  timelineDate: { fontSize: 13.5, color: "#9CA3AF", marginTop: 4 },

  estimatedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF4F0",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
  },
  estimatedLabel: { fontSize: 14.5, color: "#94665B" },
  estimatedDate: {
    fontSize: 19,
    fontWeight: "700",
    color: "#94665B",
    marginTop: 4,
  },

  actionButtons: { marginHorizontal: 20, marginBottom: 30, gap: 14 },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#94665B",
  },
  contactButtonText: { fontSize: 16.5, fontWeight: "600", color: "#94665B" },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#94665B",
    paddingVertical: 18,
    borderRadius: 18,
  },
  primaryButtonText: { fontSize: 16.5, fontWeight: "600", color: "#fff" },

  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  backButton: {
    marginTop: 28,
    backgroundColor: "#94665B",
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 30,
  },
  backButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
});
