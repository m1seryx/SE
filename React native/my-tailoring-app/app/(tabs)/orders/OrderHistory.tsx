// app/(tabs)/orders/OrderHistory.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { orderStore, Order } from "../../../utils/orderStore";

const { width } = Dimensions.get("window");

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(orderStore.getOrders());
    const unsubscribe = orderStore.subscribe(() => {
      setOrders(orderStore.getOrders());
    });
    return () => unsubscribe();
    unsubscribe();
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

  const filteredOrders = orders.filter((order) =>
    selectedFilter === "All" ? true : order.status === selectedFilter
  );

  const stats = {
    total: orders.length,
    active: orders.filter(
      (o) => o.status === "Pending" || o.status === "In Progress"
    ).length,
    completed: orders.filter((o) => o.status === "Completed").length,
    toPickup: orders.filter((o) => o.status === "To Pick up").length,
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/orders/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNo}>{item.orderNo}</Text>
          <Text style={styles.orderDate}>{item.date}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.serviceIconContainer}>
          <Ionicons
            name={
              item.service === "Customization"
                ? "shirt-outline"
                : item.service === "Rental"
                ? "business-outline"
                : item.service === "Repair Service"
                ? "construct-outline"
                : "water-outline"
            }
            size={32}
            color="#94665B"
          />
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.orderService}>{item.service}</Text>
          <Text style={styles.orderItem}>{item.item}</Text>
          {item.description && (
            <Text style={styles.orderDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.estimatedCompletion && item.status !== "Completed" && (
            <View style={styles.estimated}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.estimatedText}>
                Est: {item.estimatedCompletion}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.orderPrice}>₱{item.price}</Text>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#94665B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("../UserProfile/profile")}
        >
          <Ionicons name="arrow-back" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
      </View>

      {/* Stats Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsRow}
      >
        <View style={[styles.statCard, { backgroundColor: "#EEF2FF" }]}>
          <Ionicons name="document-text" size={28} color="#6366F1" />
          <Text style={styles.statBig}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#FEF3C7" }]}>
          <Ionicons name="hourglass-outline" size={28} color="#F59E0B" />
          <Text style={styles.statBig}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#DCFCE7" }]}>
          <Ionicons name="checkmark-circle" size={28} color="#10B981" />
          <Text style={styles.statBig}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#FCE7E7" }]}>
          <Ionicons name="basket-outline" size={28} color="#EF4444" />
          <Text style={styles.statBig}>{stats.toPickup}</Text>
          <Text style={styles.statLabel}>Pickup</Text>
        </View>
      </ScrollView>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        {filters.map((f) => {
          const count =
            f === "All"
              ? orders.length
              : orders.filter((o) => o.status === f).length;
          const isActive = selectedFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, isActive && styles.activeTab]}
              onPress={() => setSelectedFilter(f)}
            >
              <Text style={[styles.filterText, isActive && styles.activeText]}>
                {f}
              </Text>
              {count > 0 && (
                <View style={[styles.badge, isActive && styles.activeBadge]}>
                  <Text
                    style={[
                      styles.badgeText,
                      isActive && styles.activeBadgeText,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Orders List - Now FlatList (NO ScrollView!) */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === "All"
                ? "Your orders will appear here"
                : `No ${selectedFilter.toLowerCase()} orders`}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace("/home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
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
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 30,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1F2937", margin: "auto" },

  statsRow: { paddingLeft: 20, marginVertical: 16 },
  statCard: {
    width: 120,
    height: 100,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statBig: { fontSize: 32, fontWeight: "800", marginVertical: 4 },
  statLabel: { fontSize: 13, color: "#4B5563" },

  filterRow: {
    paddingLeft: width * 0.05,
    paddingBottom: 16,
  },

  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    minHeight: 44,
  },

  activeTab: {
    backgroundColor: "#94665B",
    borderColor: "#94665B",
  },

  filterText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563", // default (inactive)
  },

  activeFilterText: {
    color: "#FFFFFF", // ← THIS IS THE MISSING PIECE
  },
  activeText: { color: "#fff" },
  badge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeBadge: { backgroundColor: "rgba(255,255,255,0.2)" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#1F2937" },
  activeBadgeText: { color: "#fff" },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderNo: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  orderDate: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: { fontSize: 13, fontWeight: "600" },

  orderContent: { flexDirection: "row", alignItems: "center" },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDF4F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  orderDetails: { flex: 1 },
  orderService: { fontSize: 15, fontWeight: "700", color: "#94665B" },
  orderItem: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 4,
  },
  orderDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    lineHeight: 18,
  },
  estimated: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  estimatedText: { fontSize: 13, color: "#6B7280" },
  orderPrice: { fontSize: 22, fontWeight: "800", color: "#94665B" },

  orderActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDF4F0",
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  actionText: { fontSize: 15, fontWeight: "600", color: "#94665B" },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
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
