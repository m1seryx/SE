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
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { orderTrackingService } from "../../../utils/apiService";

const { width } = Dimensions.get("window");

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const result = await orderTrackingService.getUserOrderTracking();
      if (result.success) {
        // Find the specific order item by order_item_id
        let foundItem = null;
        for (const order of result.data) {
          const item = order.items.find((i: any) => i.order_item_id === parseInt(id));
          if (item) {
            foundItem = { ...item, order_date: order.order_date };
            break;
          }
        }
        setOrder(foundItem);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#8B5CF6";
      case "in_progress":
      case "processing":
        return "#3B82F6";
      case "ready_to_pickup":
      case "to pick up":
        return "#F59E0B";
      case "completed":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      case "price_confirmation":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "Pending";
      case "in_progress": return "In Progress";
      case "processing": return "Processing";
      case "ready_to_pickup": return "Ready to Pick Up";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "price_confirmation": return "Price Confirmation";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#94665B" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/UserProfile/profile")}
          >
            <Ionicons name="arrow-back" size={26} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.notFound}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(order.status);

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
            <Text style={styles.orderNo}>ORD-{order.order_id}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.date}>Placed on {formatDate(order.order_date)}</Text>
          <Text style={styles.serviceType}>
            {order.service_type.charAt(0).toUpperCase() + order.service_type.slice(1)} Service
          </Text>

          <View style={styles.divider} />

          {/* Image */}
          {((order.specific_data?.imageUrl && order.specific_data?.imageUrl !== 'no-image') || 
            (order.specific_data?.image_url && order.specific_data?.image_url !== 'no-image')) && (
            <Image
              source={{ 
                uri: (() => {
                  const imageUrl = order.specific_data?.imageUrl || order.specific_data?.image_url;
                  if (!imageUrl || imageUrl === 'no-image') return '';
                  if (imageUrl.startsWith('http')) return imageUrl;
                  return `http://192.168.1.202:5000${imageUrl}`;
                })() 
              }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {/* Service Details Section */}
          {order.specific_data && (
            <View style={styles.serviceDetailsSection}>
              <Text style={styles.sectionTitle}>Service Details</Text>
              
              {/* Dry Cleaning Details */}
              {order.service_type === 'dry_cleaning' && (
                <>
                  {order.specific_data.serviceName && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Service</Text>
                      <Text style={styles.value}>{order.specific_data.serviceName}</Text>
                    </View>
                  )}
                  {order.specific_data.garmentType && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Garment Type</Text>
                      <Text style={styles.value}>{order.specific_data.garmentType}</Text>
                    </View>
                  )}
                  {order.specific_data.clothingBrand && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Brand</Text>
                      <Text style={styles.value}>{order.specific_data.clothingBrand}</Text>
                    </View>
                  )}
                  {order.specific_data.quantity && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Quantity</Text>
                      <Text style={styles.value}>{order.specific_data.quantity} items</Text>
                    </View>
                  )}
                  {order.specific_data.specialInstructions && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Special Instructions</Text>
                      <Text style={[styles.value, styles.multiline]}>
                        {order.specific_data.specialInstructions}
                      </Text>
                    </View>
                  )}
                  {order.specific_data.pickupDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Pickup Date</Text>
                      <Text style={styles.value}>
                        {formatDate(order.specific_data.pickupDate)}
                      </Text>
                    </View>
                  )}
                </>
              )}
              
              {/* Repair Details */}
              {order.service_type === 'repair' && (
                <>
                  {order.specific_data.garmentType && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Garment Type</Text>
                      <Text style={styles.value}>{order.specific_data.garmentType}</Text>
                    </View>
                  )}
                  {order.specific_data.damageLevel && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Damage Level</Text>
                      <Text style={styles.value}>{order.specific_data.damageLevel}</Text>
                    </View>
                  )}
                  {order.specific_data.damageDescription && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Damage Description</Text>
                      <Text style={[styles.value, styles.multiline]}>
                        {order.specific_data.damageDescription}
                      </Text>
                    </View>
                  )}
                  {order.specific_data.damageLocation && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Damage Location</Text>
                      <Text style={styles.value}>{order.specific_data.damageLocation}</Text>
                    </View>
                  )}
                  {order.specific_data.pickupDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Expected Pickup Date</Text>
                      <Text style={styles.value}>
                        {formatDate(order.specific_data.pickupDate)}
                      </Text>
                    </View>
                  )}
                </>
              )}
              
              {/* Rental Details */}
              {order.service_type === 'rental' && (
                <>
                  {order.specific_data.item_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Item Name</Text>
                      <Text style={styles.value}>{order.specific_data.item_name}</Text>
                    </View>
                  )}
                  {order.specific_data.brand && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Brand</Text>
                      <Text style={styles.value}>{order.specific_data.brand}</Text>
                    </View>
                  )}
                  {order.specific_data.size && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Size</Text>
                      <Text style={styles.value}>{order.specific_data.size}</Text>
                    </View>
                  )}
                  {order.specific_data.category && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Category</Text>
                      <Text style={styles.value}>{order.specific_data.category}</Text>
                    </View>
                  )}
                  {order.rental_period && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Rental Period</Text>
                      <Text style={styles.value}>{order.rental_period} days</Text>
                    </View>
                  )}
                  {order.rental_start_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Start Date</Text>
                      <Text style={styles.value}>{formatDate(order.rental_start_date)}</Text>
                    </View>
                  )}
                  {order.rental_end_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>End Date</Text>
                      <Text style={styles.value}>{formatDate(order.rental_end_date)}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Total Price */}
          <View style={styles.priceSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>
              ₱{parseFloat(order.final_price).toLocaleString()}
            </Text>
          </View>
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
  serviceType: {
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
  serviceDetailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
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
  notFound: {
    flex: 1,
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
    color: "#6B7280",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
});
