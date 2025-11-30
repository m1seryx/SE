// app/(tabs)/orders/OrderHistory.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { orderStore, Order } from "../../utils/orderStore";

const { width, height } = Dimensions.get("window");

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders on mount and subscribe to changes
  useEffect(() => {
    setOrders(orderStore.getOrders());

    const unsubscribe = orderStore.subscribe(() => {
      setOrders(orderStore.getOrders());
    });

    return () => unsubscribe();
  }, []);

  const filters = [
    "All",
    "Pending",
    "In Progress",
    "To Pick up",
    "Completed",
    "Cancelled",
  ];

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress":
        return "time-outline";
      case "Completed":
        return "checkmark-circle-outline";
      case "To Pick up":
        return "basket-outline";
      case "Cancelled":
        return "close-circle-outline";
      case "Pending":
        return "hourglass-outline";
      default:
        return "ellipse-outline";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === "All") return true;
    return order.status === selectedFilter;
  });

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "Pending").length,
      inProgress: orders.filter((o) => o.status === "In Progress").length,
      toPickup: orders.filter((o) => o.status === "To Pick up").length,
      completed: orders.filter((o) => o.status === "Completed").length,
    };
  };

  const stats = getOrderStats();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <View style={[styles.statCard, { backgroundColor: "#EEF2FF" }]}>
          <Ionicons name="document-text" size={24} color="#6366F1" />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#FEF3C7" }]}>
          <Ionicons name="time" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {stats.pending + stats.inProgress}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#DCFCE7" }]}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#FFE4E6" }]}>
          <Ionicons name="basket" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.toPickup}</Text>
          <Text style={styles.statLabel}>To Pick Up</Text>
        </View>
      </ScrollView>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter}
            </Text>
            {filter !== "All" && (
              <View
                style={[
                  styles.filterBadge,
                  selectedFilter === filter && styles.filterBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    selectedFilter === filter && styles.filterBadgeTextActive,
                  ]}
                >
                  {orders.filter((o) => o.status === filter).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        contentContainerStyle={{ paddingBottom: height * 0.12 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedFilter === "All"
                ? "You haven't placed any orders yet"
                : `No ${selectedFilter.toLowerCase()} orders`}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push(`/orders/${order.id}`)}
              activeOpacity={0.7}
            >
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderNo}>{order.orderNo}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + "20" },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(order.status) as any}
                    size={14}
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

              {/* Order Content */}
              <View style={styles.orderContent}>
                <View style={styles.serviceIconContainer}>
                  <Ionicons
                    name={
                      order.service === "Customization"
                        ? "shirt-outline"
                        : order.service === "Rental"
                        ? "business-outline"
                        : order.service === "Repair Service"
                        ? "construct-outline"
                        : "water-outline"
                    }
                    size={28}
                    color="#94665B"
                  />
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.orderService}>{order.service}</Text>
                  <Text style={styles.orderItem}>{order.item}</Text>
                  {order.description && (
                    <Text style={styles.orderDescription} numberOfLines={2}>
                      {order.description}
                    </Text>
                  )}
                  {order.estimatedCompletion &&
                    order.status !== "Completed" && (
                      <View style={styles.estimatedCompletion}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.estimatedText}>
                          Est: {order.estimatedCompletion}
                        </Text>
                      </View>
                    )}
                </View>

                <View style={styles.orderPriceContainer}>
                  <Text style={styles.orderPrice}>₱{order.price}</Text>
                </View>
              </View>

              {/* Order Actions */}
              <View style={styles.orderActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/appointment/AppointmentScreen")}
        >
          <View style={styles.navItemWrap}>
            <Ionicons name="receipt-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(tabs)/cart/Cart")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="cart-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/UserProfile/profile")}
        >
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
    backgroundColor: "#F7F7F8",
  },

  header: {
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },

  // Stats Cards
  statsContainer: {
    marginBottom: 16,
  },
  statsContent: {
    paddingHorizontal: width * 0.04,
    gap: 12,
  },
  statCard: {
    width: width * 0.35,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    height: 100,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },

  // Filter Tabs
  filterContainer: {
    marginTop: -250,
  },
  filterContent: {
    paddingHorizontal: width * 0.04,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
    height: 50,
  },
  filterTabActive: {
    backgroundColor: "#94665B",
    borderColor: "#94665B",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  filterBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  filterBadgeTextActive: {
    color: "#fff",
  },

  // Orders List
  ordersList: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },

  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  orderContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5ECE3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderService: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94665B",
    marginBottom: 4,
  },
  orderItem: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  orderDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 6,
  },
  estimatedCompletion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  estimatedText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  orderPriceContainer: {
    justifyContent: "center",
  },
  orderPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#94665B",
  },

  orderActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.15,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  // Bottom Navigation
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
});
