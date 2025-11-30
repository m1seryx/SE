// app/orders/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orderStore, Order } from "../../utils/orderStore";

const { width } = Dimensions.get("window");

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const foundOrder = orderStore.getOrderById(id);
    setOrder(foundOrder || null);
  }, [id]);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#8B5CF6";
      case "In Progress":
        return "#3B82F6";
      case "To Pick up":
        return "#F59E0B";
      case "Completed":
        return "#10B981";
      case "Cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const statusColor = getStatusColor(order.status);

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    orderStore.updateOrderStatus(id, "Cancelled");
    setOrder({ ...order, status: "Cancelled" });
    setShowCancelModal(false);
  };

  const isPending = order.status === "Pending";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
        >
          <Ionicons name="arrow-back" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <Text style={styles.orderNo}>{order.orderNo}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {order.status}
              </Text>
            </View>
          </View>

          <Text style={styles.date}>Placed on {order.date}</Text>
          {order.appointmentDate && (
            <Text style={styles.appointment}>
              Appointment: {order.appointmentDate}
            </Text>
          )}

          <View style={styles.divider} />

          {/* Image */}
          {order.image && (
            <Image
              source={{ uri: order.image }}
              style={styles.image}
              resizeMode="contain"
            />
          )}

          {/* Details */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Service</Text>
            <Text style={styles.value}>{order.service}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Item</Text>
            <Text style={styles.value}>{order.item}</Text>
          </View>

          {order.description && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{order.description}</Text>
            </View>
          )}

          {order.garmentType && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Garment Type</Text>
              <Text style={styles.value}>{order.garmentType}</Text>
            </View>
          )}

          {order.damageType && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Damage Type</Text>
              <Text style={styles.value}>{order.damageType}</Text>
            </View>
          )}

          {order.quantity && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Quantity</Text>
              <Text style={styles.value}>{order.quantity} item(s)</Text>
            </View>
          )}

          {order.specialInstructions && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Special Instructions</Text>
              <Text style={[styles.value, styles.multiline]}>
                {order.specialInstructions}
              </Text>
            </View>
          )}

          {/* Total Price */}
          <View style={styles.priceSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>
              ₱{order.price.toLocaleString()}
            </Text>
          </View>

          {/* Cancel Button - Only show if Pending */}
          {isPending && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <Ionicons name="home-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
        >
          <Ionicons name="receipt-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(tabs)/cart/Cart")}>
          <Ionicons name="cart-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
        >
          <Ionicons name="person" size={26} color="#7A5A00" />
        </TouchableOpacity>
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.cancelBtnText}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={confirmCancel}
              >
                <Text style={styles.confirmBtnText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  scrollContent: { padding: 20, paddingBottom: 140 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNo: { fontSize: 19, fontWeight: "700", color: "#1F2937" },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: "600" },
  date: { fontSize: 14, color: "#6B7280", marginBottom: 4 },
  appointment: {
    fontSize: 15.5,
    color: "#94665B",
    fontWeight: "600",
    marginBottom: 16,
  },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 20 },
  image: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  detailRow: { marginBottom: 18 },
  label: { fontSize: 14, color: "#6B7280", marginBottom: 6 },
  value: { fontSize: 17, color: "#1F2937", fontWeight: "500", lineHeight: 24 },
  multiline: { lineHeight: 26 },
  priceSection: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1.5,
    borderTopColor: "#F3F4F6",
    alignItems: "flex-end",
  },
  totalLabel: { fontSize: 18, color: "#6B7280", marginBottom: 6 },
  totalPrice: { fontSize: 32, fontWeight: "800", color: "#94665B" },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#EF4444",
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  notFound: {
    flex: 1,
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
    color: "#6B7280",
  },
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
    elevation: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    color: "#1F2937",
  },
  modalMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: "#EF4444",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
