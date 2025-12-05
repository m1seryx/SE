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
import { LinearGradient } from "expo-linear-gradient";

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
        <View style={styles.notFoundContainer}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="search-outline" size={70} color="#CBD5E1" />
          </View>
          <Text style={styles.notFoundTitle}>Order Not Found</Text>
          <Text style={styles.notFoundSubtitle}>
            We couldn't find the order you're looking for
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return "time-outline";
      case "In Progress":
        return "construct-outline";
      case "To Pick up":
        return "bag-check-outline";
      case "Completed":
        return "checkmark-circle-outline";
      case "Cancelled":
        return "close-circle-outline";
      default:
        return "alert-circle-outline";
    }
  };

  const statusColor = getStatusColor(order.status);
  const statusIcon = getStatusIcon(order.status);

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
      {/* Enhanced Gradient Header */}
      <LinearGradient
        colors={["#78350F", "#92400E", "#A16207"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content Card */}
        <View style={styles.card}>
          {order.image && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: order.image }}
                style={styles.image}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.4)"]}
                style={styles.imageOverlay}
              />
            </View>
          )}

          {/* Service Info Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#78350F" />
            <Text style={styles.sectionTitle}>Service Information</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="cube-outline" size={28} color="#F59E0B" />
              <Text style={styles.infoCardLabel}>Service</Text>
              <Text style={styles.infoCardValue}>{order.service}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="pricetag-outline" size={28} color="#F59E0B" />
              <Text style={styles.infoCardLabel}>Item</Text>
              <Text style={styles.infoCardValue}>{order.item}</Text>
            </View>
          </View>

          {/* Detailed Information */}
          <View style={styles.detailsSection}>
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

            {order.clothingBrand && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Brand</Text>
                <Text style={styles.value}>{order.clothingBrand}</Text>
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
          </View>

          {/* Price Section with Gradient */}
          <LinearGradient
            colors={["#FEF3C7", "#FDE68A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.priceSection}
          >
            <View style={styles.priceContent}>
              <View>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.priceBreakdown}>Including service fee</Text>
              </View>
              <Text style={styles.totalPrice}>
                ₱{order.price.toLocaleString()}
              </Text>
            </View>
          </LinearGradient>

          {/* Cancel Button - Enhanced */}
          {isPending && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* Status Section - Moved to Bottom */}
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse-outline" size={24} color="#78350F" />
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>

          <View style={styles.statusSection}>
            <LinearGradient
              colors={[statusColor + "20", statusColor + "10"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusCard}
            >
              <View style={styles.statusIconSmall}>
                <Ionicons
                  name={statusIcon as any}
                  size={32}
                  color={statusColor}
                />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusLabel}>Current Status</Text>
                <Text style={[styles.statusValue, { color: statusColor }]}>
                  {order.status}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Timeline Info - Moved to Bottom */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Order Placed</Text>
                <Text style={styles.timelineValue}>{order.date}</Text>
              </View>
            </View>

            {order.appointmentDate && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, styles.timelineDotSecondary]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Appointment Date</Text>
                  <Text style={styles.timelineValue}>
                    {order.appointmentDate}
                  </Text>
                </View>
              </View>
            )}

            {order.estimatedCompletion && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, styles.timelineDotTertiary]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Est. Completion</Text>
                  <Text style={styles.timelineValue}>
                    {order.estimatedCompletion}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Enhanced Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => router.push("/home")}
          style={styles.navItemWrap}
        >
          <Ionicons name="home" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
          style={styles.navItemWrap}
        >
          <Ionicons name="calendar-outline" size={22} color="#64748B" />
          <Text style={styles.navLabel}>Book</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/cart/Cart")}
          style={styles.navItemWrap}
        >
          <Ionicons name="cart-outline" size={22} color="#64748B" />
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

      {/* Enhanced Cancel Confirmation Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={["#FEE2E2", "#FEE2E2"]}
                style={styles.modalIconGradient}
              >
                <Ionicons name="warning-outline" size={56} color="#EF4444" />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this order? This action cannot be
              undone and may affect your service timeline.
            </Text>

            <View style={styles.orderInfoBox}>
              <Text style={styles.orderInfoLabel}>Order Number</Text>
              <Text style={styles.orderInfoValue}>{order.orderNo}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.keepOrderBtn}
                onPress={() => setShowCancelModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.keepOrderBtnText}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={confirmCancel}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.confirmCancelBtnText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Enhanced Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
  },

  moreBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },

  // Status Hero Card
  statusHeroCard: {
    marginBottom: 24,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },

  statusHeroGradient: {
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: "center",
  },

  statusIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },

  statusHeroText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  orderNoHero: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1,
  },

  // Main Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  // Timeline Section
  timelineSection: {
    marginTop: 24,
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#78350F",
    marginRight: 16,
    marginTop: 4,
    shadowColor: "#78350F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  timelineDotSecondary: {
    backgroundColor: "#F59E0B",
    shadowColor: "#F59E0B",
  },

  timelineDotTertiary: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },

  timelineContent: {
    flex: 1,
  },

  timelineLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },

  timelineValue: {
    fontSize: 17,
    color: "#1E293B",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },

  // Premium Image
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 0.3,
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },

  infoCard: {
    flex: 1,
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FDE68A",
  },

  infoCardLabel: {
    fontSize: 13,
    color: "#78350F",
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },

  infoCardValue: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "800",
    textAlign: "center",
  },

  // Details Section
  detailsSection: {
    marginBottom: 24,
  },

  detailRow: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  label: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  value: {
    fontSize: 17,
    color: "#1E293B",
    fontWeight: "600",
    lineHeight: 26,
  },

  multiline: {
    lineHeight: 28,
  },

  // Price Section
  priceSection: {
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  priceContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 18,
    color: "#78350F",
    fontWeight: "700",
    marginBottom: 4,
  },

  priceBreakdown: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
  },

  totalPrice: {
    fontSize: 36,
    fontWeight: "900",
    color: "#78350F",
    letterSpacing: -1,
  },

  // Cancel Button
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#EF4444",
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  cancelButtonText: {
    color: "#EF4444",
    fontSize: 17,
    fontWeight: "700",
  },

  // Status Section (Bottom)
  statusSection: {
    marginBottom: 20,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 16,
  },

  statusIconSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  statusContent: {
    flex: 1,
  },

  statusLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },

  statusValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  // Not Found State
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  notFoundIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  notFoundTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },

  notFoundSubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#78350F",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#78350F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Bottom Navigation
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
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },

  navItemWrap: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 4,
  },

  navLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },

  // Enhanced Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 25,
  },

  modalIconContainer: {
    marginBottom: 24,
  },

  modalIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FEE2E2",
  },

  modalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 12,
  },

  modalMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },

  orderInfoBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  orderInfoLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  orderInfoValue: {
    fontSize: 17,
    color: "#1E293B",
    fontWeight: "800",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  keepOrderBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },

  keepOrderBtnText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "700",
  },

  confirmCancelBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  confirmCancelBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
