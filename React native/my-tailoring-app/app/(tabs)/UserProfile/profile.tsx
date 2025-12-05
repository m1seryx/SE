// app/(tabs)/UserProfile/profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { orderStore, Order } from "../../../utils/orderStore";
import { authService, orderTrackingService, notificationService } from "../../../utils/apiService";

const { width, height } = Dimensions.get("window");

interface UserData {
  name: string;
  email: string;
  phone: string;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<UserData>({
    name: "Loading...",
    email: "Loading...",
    phone: "Loading...",
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState<UserData>(user);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load orders on mount and subscribe to changes
  useEffect(() => {
    setOrders(orderStore.getOrders());

    const unsubscribe = orderStore.subscribe(() => {
      setOrders(orderStore.getOrders());
    });

    return () => unsubscribe();
  }, []);

  // Fetch user profile data from API
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch order tracking data on mount and when screen comes into focus
  useEffect(() => {
    fetchOrderTracking();
  }, []);

  // Refresh order tracking when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchOrderTracking();
      fetchUnreadCount();
    }, [])
  );

  const fetchOrderTracking = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const result = await orderTrackingService.getUserOrderTracking();
      console.log("Orders fetched:", result);
      if (result.success) {
        // Additional filter to ensure no rejected orders appear
        const filteredOrders = result.data.map((order: any) => ({
          ...order,
          items: order.items.filter((item: any) =>
            item.status !== 'cancelled' &&
            item.status !== 'rejected' &&
            item.status !== 'price_declined'
          )
        })).filter((order: any) => order.items.length > 0);

        setOrders(filteredOrders);
        console.log("Filtered orders data:", filteredOrders);
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error loading orders');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    fetchOrderTracking(true);
    fetchUnreadCount();
  };

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response && response.user) {
        const userData = response.user;
        // Combine first_name and last_name
        const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || "User";
        
        setUser({
          name: fullName,
          email: userData.email || "",
          phone: userData.phone_number || "",
        });
      } else {
        // Fallback to some default values if API doesn't return expected data
        setUser({
          name: "User",
          email: "user@example.com",
          phone: "",
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Failed to load profile data");
      // Fallback to some default values
      setUser({
        name: "User",
        email: "user@example.com",
        phone: "",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    const statusMap: any = {
      'pending': 'pending',
      'accepted': 'accepted',
      'price_confirmation': 'price-confirmation',
      'in_progress': 'in-progress',
      'ready_to_pickup': 'ready',
      'picked_up': 'picked-up',
      'rented': 'rented',
      'returned': 'returned',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'price_declined': 'cancelled'
    };
    return statusMap[status] || 'unknown';
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const statusMap: any = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'price_confirmation': 'Price Confirmation',
      'in_progress': 'In Progress',
      'ready_to_pickup': 'Ready to Pickup',
      'picked_up': 'Picked Up',
      'rented': 'Rented',
      'returned': 'Returned',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'price_declined': 'Price Declined'
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colorMap: any = {
      'pending': '#8B5CF6',
      'accepted': '#3B82F6',
      'price_confirmation': '#F59E0B',
      'in_progress': '#3B82F6',
      'ready_to_pickup': '#F59E0B',
      'picked_up': '#10B981',
      'rented': '#10B981',
      'returned': '#10B981',
      'completed': '#10B981',
      'cancelled': '#EF4444',
      'price_declined': '#EF4444'
    };
    return colorMap[status] || '#6B7280';
  };

  // Helper function to get timeline dot status
  const getStatusDotClass = (currentStatus: string, stepStatus: string, serviceType: string | null = null) => {
    // Define status flows for different service types
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned', 'completed'];
    // Updated default flow to handle both workflows
    const defaultFlow = ['pending', 'price_confirmation', 'accepted', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    if (currentIndex >= stepIndex) {
      return 'completed';
    } else {
      return 'pending';
    }
  };

  // Helper function to check if timeline item should be marked as completed
  const getTimelineItemClass = (currentStatus: string, stepStatus: string, serviceType: string | null = null) => {
    // Define status flows for different service types
    const rentalFlow = ['pending', 'ready_to_pickup', 'ready_for_pickup', 'rented', 'returned', 'completed'];
    // Updated default flow to handle both workflows
    const defaultFlow = ['pending', 'price_confirmation', 'accepted', 'in_progress', 'ready_to_pickup', 'completed'];

    const statusFlow = serviceType === 'rental' ? rentalFlow : defaultFlow;

    // Normalize status for comparison
    const normalizedCurrent = currentStatus === 'ready_for_pickup' ? 'ready_to_pickup' : currentStatus;
    const normalizedStep = stepStatus === 'ready_for_pickup' ? 'ready_to_pickup' : stepStatus;

    const currentIndex = statusFlow.indexOf(normalizedCurrent);
    const stepIndex = statusFlow.indexOf(normalizedStep);

    return currentIndex >= stepIndex ? 'completed' : '';
  };

  // Helper function to get estimated price from specific_data
  const getEstimatedPrice = (specificData: any, serviceType: string) => {
    if (serviceType === 'repair') {
      // First check if estimated price is explicitly provided
      if (specificData?.estimatedPrice) {
        return specificData.estimatedPrice;
      }
      // Otherwise calculate from damage level
      const damageLevel = specificData?.damageLevel;
      const prices: any = {
        'minor': 300,
        'moderate': 500,
        'major': 800,
        'severe': 1200
      };
      return prices[damageLevel] || 0;
    } else if (serviceType === 'dry_cleaning') {
      // Calculate estimated price for dry cleaning
      // Formula: base_price + (price_per_item * quantity)
      const serviceName = specificData?.serviceName || '';
      const quantity = specificData?.quantity || 1;

      const basePrices: any = {
        'Basic Dry Cleaning': 200,
        'Premium Dry Cleaning': 350,
        'Delicate Items': 450,
        'Express Service': 500
      };

      const pricePerItem: any = {
        'Basic Dry Cleaning': 150,
        'Premium Dry Cleaning': 250,
        'Delicate Items': 350,
        'Express Service': 400
      };

      const basePrice = basePrices[serviceName] || 200;
      const perItemPrice = pricePerItem[serviceName] || 150;

      return basePrice + (perItemPrice * quantity);
    }
    return 0;
  };

  // Helper function to check if price changed
  const hasPriceChanged = (specificData: any, finalPrice: number, serviceType: string) => {
    // Check if admin has explicitly marked the price as updated
    if (specificData?.adminPriceUpdated === true) {
      return true;
    }
    
    // For backward compatibility, check if there's a significant difference
    // but only if there's an admin note indicating intentional change
    const estimatedPrice = getEstimatedPrice(specificData, serviceType);
    
    if (estimatedPrice > 0 && specificData?.adminNotes) {
      const difference = Math.abs(finalPrice - estimatedPrice);
      return difference > 0.01; // Allow for small floating point differences
    }
    
    // If no explicit indication from admin, it's not considered a change
    return false;
  };

  // Helper function to determine if price confirmation should be shown
  const shouldShowPriceConfirmation = (item: any) => {
    const isPriceConfirmationStatus = item.status === 'price_confirmation';
    const priceChanged = hasPriceChanged(item.specific_data, parseFloat(item.final_price), item.service_type);
    
    // Show price confirmation only if:
    // 1. Status is 'price_confirmation'
    // 2. Price has actually been changed by admin (not just set)
    return isPriceConfirmationStatus && priceChanged;
  };

  // Handle accept price
  const handleAcceptPrice = async (item: any) => {
    try {
      const response = await orderTrackingService.acceptPrice(item.order_item_id);
      
      if (response.success) {
        Alert.alert('Success', 'Price accepted! Your order is now accepted.');
        // Refresh orders to show updated status
        fetchOrderTracking();
      } else {
        Alert.alert('Error', response.message || 'Failed to accept price');
        console.error('Failed to accept price:', response);
      }
    } catch (error) {
      Alert.alert('Error', 'Error accepting price. Please try again.');
      console.error('Error accepting price:', error);
    }
  };

  // Handle decline price
  const handleDeclinePrice = async (item: any) => {
    try {
      const response = await orderTrackingService.declinePrice(item.order_item_id);
      
      if (response.success) {
        Alert.alert('Success', 'Price declined. Your order has been cancelled.');
        // Refresh orders to show updated status
        fetchOrderTracking();
      } else {
        Alert.alert('Error', response.message || 'Failed to decline price');
        console.error('Failed to decline price:', response);
      }
    } catch (error) {
      Alert.alert('Error', 'Error declining price. Please try again.');
      console.error('Error declining price:', error);
    }
  };

  const openEditModal = () => {
    setEditedUser(user);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditedUser(user);
  };

  const saveProfile = async () => {
    if (!editedUser.name.trim()) {
      alert("Name cannot be empty");
      return;
    }
    if (!editedUser.email.trim()) {
      alert("Email cannot be empty");
      return;
    }
    if (!editedUser.phone.trim()) {
      alert("Phone cannot be empty");
      return;
    }

    try {
      // Split name into first and last name for API
      const nameParts = editedUser.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        email: editedUser.email,
        phone_number: editedUser.phone
      };
      
      const response = await authService.updateProfile(updateData);
      
      if (response.success) {
        setUser(editedUser);
        setEditModalVisible(false);
        alert("Profile updated successfully!");
      } else {
        alert(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#94665B"]}
            tintColor="#94665B"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("../home")}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color="#94665B" />
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={openEditModal}
          >
            <Ionicons name="pencil" size={16} color="#94665B" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#94665B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Tracking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Tracking</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/orders/OrderHistory")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#94665B" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Ionicons name="receipt-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyOrdersText}>No orders found</Text>
              <Text style={styles.emptyOrdersSubtext}>
                Book a service to see your orders here
              </Text>
            </View>
          ) : (
            <View style={styles.orderCards}>
              {orders?.flatMap((order: any) => 
                order.items.map((item: any) => {
                  const estimatedPrice = getEstimatedPrice(item.specific_data, item.service_type);
                  const priceChanged = hasPriceChanged(item.specific_data, parseFloat(item.final_price), item.service_type);
                  
                  return (
                    <View key={`${item.order_id}-${item.order_item_id}`} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderNo}>ORD-{item.order_id}</Text>
                          <Text style={styles.serviceType}>
                            {item.service_type.charAt(0).toUpperCase() + item.service_type.slice(1)}
                            {item.specific_data?.serviceName && (
                              <Text style={styles.serviceName}>
                                {" - " + item.specific_data.serviceName}
                              </Text>
                            )}
                          </Text>
                        </View>
                        <View style={styles.orderPriceContainer}>
                          <Text style={styles.orderPrice}>₱{parseFloat(item.final_price).toFixed(2)}</Text>
                        </View>
                      </View>

                      <View style={styles.orderStatus}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status) + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(item.status) },
                            ]}
                          >
                            {getStatusLabel(item.status)}
                          </Text>
                        </View>
                      </View>

                      {/* Price Comparison */}
                      {(estimatedPrice > 0 || parseFloat(item.final_price) > 0) && (
                        <View style={styles.priceComparison}>
                          {estimatedPrice > 0 ? (
                            <>
                              <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Estimated Price:</Text>
                                <Text style={styles.priceValueEstimated}>₱{estimatedPrice.toFixed(2)}</Text>
                              </View>
                              <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Final Price:</Text>
                                <Text style={[styles.priceValueFinal, priceChanged ? styles.priceChanged : styles.priceSame]}>
                                  ₱{parseFloat(item.final_price).toFixed(2)}
                                  {priceChanged && item.status === 'price_confirmation' && (
                                    <Text style={styles.priceChangeIndicator}> ⚠️ Updated by Admin</Text>
                                  )}
                                </Text>
                              </View>
                            </>
                          ) : (
                            <View style={styles.priceRow}>
                              <Text style={styles.priceLabel}>Final Price:</Text>
                              <Text style={styles.priceValueFinal}>₱{parseFloat(item.final_price).toFixed(2)}</Text>
                            </View>
                          )}
                          {priceChanged && item.status === 'price_confirmation' && item.specific_data?.adminNotes && (
                            <View style={styles.adminNotes}>
                              <Text style={styles.notesLabel}>Admin Note:</Text>
                              <Text style={styles.notesText}>{item.specific_data.adminNotes}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Order Timeline */}
                      <View style={styles.orderTimeline}>
                        <View style={styles.timelineContainer}>
                          {/* Conditional timeline based on service type */}
                          {item.service_type === 'rental' ? (
                            <>
                              {/* Rental Timeline: Order Placed → Ready to Pick Up → Rented → Returned → Completed */}
                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'pending', 'rental') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'pending', 'rental') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Order Placed</Text>
                                  <Text style={styles.timelineDate}>{formatDate(order.order_date)}</Text>
                                </View>
                              </View>

                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'ready_to_pickup', 'rental') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'ready_to_pickup', 'rental') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Ready to Pick Up</Text>
                                  <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                </View>
                              </View>

                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'rented', 'rental') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'rented', 'rental') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Rented</Text>
                                  <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                </View>
                              </View>

                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'returned', 'rental') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'returned', 'rental') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Returned</Text>
                                  <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                </View>
                              </View>

                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'completed', 'rental') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'completed', 'rental') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Completed</Text>
                                  <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                </View>
                              </View>
                            </>
                          ) : (
                            <>
                              {/* Default Timeline for Repair/Dry Cleaning/Customize */}
                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'pending') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'pending') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Order Placed</Text>
                                  <Text style={styles.timelineDate}>{formatDate(order.order_date)}</Text>
                                </View>
                              </View>

                              {/* Show Price Confirmation step only when status is price_confirmation */}
                              {item.status === 'price_confirmation' && (
                                <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'price_confirmation') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                  <View style={[styles.timelineDot, getStatusDotClass(item.status, 'price_confirmation') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                  <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Price Confirmation</Text>
                                    <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                  </View>
                                </View>
                              )}
                              
                              {/* Show Accepted step only when status is accepted */}
                              {item.status === 'accepted' && (
                                <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'accepted') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                  <View style={[styles.timelineDot, getStatusDotClass(item.status, 'accepted') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                  <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Accepted</Text>
                                    <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                  </View>
                                </View>
                              )}

                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'in_progress') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'in_progress') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>In Progress</Text>
                                  <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                </View>
                              </View>

                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'ready_to_pickup') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'ready_to_pickup') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Ready to Pick Up</Text>
                                  <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                </View>
                              </View>

                              <View style={[styles.timelineItem, getTimelineItemClass(item.status, 'completed') === 'completed' ? styles.timelineItemCompleted : {}]}>
                                <View style={[styles.timelineDot, getStatusDotClass(item.status, 'completed') === 'completed' ? styles.timelineDotCompleted : styles.timelineDotPending]} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Completed</Text>
                                  <Text style={styles.timelineDate}>{formatDate(item.status_updated_at)}</Text>
                                </View>
                              </View>
                            </>
                          )}
                        </View>
                      </View>

                      {/* Price Confirmation Actions - Only show when admin has actually edited the price */}
                      {shouldShowPriceConfirmation(item) && (
                        <View style={styles.priceConfirmationActions}>
                          <View style={styles.confirmationMessage}>
                            <Text style={styles.confirmationTitle}>Price Update Required</Text>
                            <Text style={styles.confirmationText}>Please review the updated pricing and confirm to proceed.</Text>
                          </View>
                          <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.btnAcceptPrice} onPress={() => handleAcceptPrice(item)}>
                              <Text style={styles.btnAcceptPriceText}>Accept Price - Continue</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnDeclinePrice} onPress={() => handleDeclinePrice(item)}>
                              <Text style={styles.btnDeclinePriceText}>Decline Price</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      <View style={styles.orderFooter}>
                        <View style={styles.orderDates}>
                          <Text style={styles.dateInfo}>Requested: {formatDate(order.order_date)}</Text>
                          <Text style={styles.dateInfo}>Updated: {formatDate(item.status_updated_at)}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.viewDetailsBtn}
                          onPress={() => router.push(`/orders/${item.order_item_id}`)}
                        >
                          <Text style={styles.viewDetailsText}>View Details</Text>
                          <Ionicons name="chevron-forward" size={16} color="#94665B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, { borderBottomWidth: 0 }]}
            onPress={() => {
              router.replace("/login");
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionText, { color: "#EF4444" }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeEditModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeEditModal}>
                  <Ionicons name="close" size={28} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <View style={{ width: 28 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Avatar Section */}
                <View style={styles.modalAvatarSection}>
                  <View style={styles.modalAvatar}>
                    <Ionicons name="person" size={50} color="#94665B" />
                  </View>
                  <TouchableOpacity style={styles.changePhotoBtn}>
                    <Ionicons name="camera" size={18} color="#94665B" />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>

                {/* Personal Information */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>
                    Personal Information
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#94665B"
                      />
                      <TextInput
                        style={styles.input}
                        value={editedUser.name}
                        onChangeText={(text) =>
                          setEditedUser({ ...editedUser, name: text })
                        }
                        placeholder="Enter your full name"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#94665B" />
                      <TextInput
                        style={styles.input}
                        value={editedUser.email}
                        onChangeText={(text) =>
                          setEditedUser({ ...editedUser, email: text })
                        }
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>
                    Contact Information
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color="#94665B" />
                      <TextInput
                        style={styles.input}
                        value={editedUser.phone}
                        onChangeText={(text) =>
                          setEditedUser({ ...editedUser, phone: text })
                        }
                        placeholder="Enter your phone number"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeEditModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveProfile}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home-outline" size={20} color="#9CA3AF" />
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

        <View style={styles.navItemWrapActive}>
          <Ionicons name="person" size={20} color="#7A5A00" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F7F8" },
  container: { flex: 1 },
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
    flex: 1,
    textAlign: "center",
  },
  notificationBtn: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: width * 0.04,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5ECE3",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#94665B",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F5ECE3",
    borderRadius: 20,
  },
  editProfileText: {
    color: "#94665B",
    fontWeight: "600",
    fontSize: 14,
  },

  section: {
    marginHorizontal: width * 0.04,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: "#94665B",
    fontWeight: "600",
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },

  emptyOrders: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyOrdersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },

  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginTop: 12,
  },

  orderCards: {
    // Container for all order cards
  },
  serviceType: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  serviceName: {
    fontSize: 12,
    color: "#94665B",
    fontWeight: "600",
  },
  orderStatus: {
    marginBottom: 12,
  },
  priceComparison: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  priceValueEstimated: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  priceValueFinal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  priceChanged: {
    color: "#EF4444",
  },
  priceSame: {
    color: "#10B981",
  },
  priceChangeIndicator: {
    fontSize: 10,
    color: "#F59E0B",
  },
  adminNotes: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  notesText: {
    fontSize: 12,
    color: "#92400E",
    marginTop: 2,
  },
  orderTimeline: {
    marginBottom: 16,
  },
  timelineContainer: {
    flexDirection: "column",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timelineItemCompleted: {
    // No additional styling needed
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timelineDotPending: {
    backgroundColor: "#D1D5DB",
  },
  timelineDotCompleted: {
    backgroundColor: "#10B981",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  priceConfirmationActions: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  confirmationMessage: {
    marginBottom: 12,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  confirmationText: {
    fontSize: 14,
    color: "#92400E",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  btnAcceptPrice: {
    flex: 1,
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnAcceptPriceText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  btnDeclinePrice: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnDeclinePriceText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
  },
  orderInfo: {
    flex: 1,
  },
  orderNo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  orderPriceContainer: {
    justifyContent: "center",
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#94665B",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderDates: {
    flex: 1,
  },
  dateInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  orderService: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  orderItem: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.9,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },

  modalAvatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5ECE3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5ECE3",
    borderRadius: 16,
  },
  changePhotoText: {
    color: "#94665B",
    fontWeight: "600",
    fontSize: 14,
  },

  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  textAreaContainer: {
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 4,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#94665B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#94665B",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  
  viewDetailsText: {
    fontSize: 14,
    color: "#94665B",
    fontWeight: "600",
  },
  
  serviceDetails: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  serviceDetailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
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
