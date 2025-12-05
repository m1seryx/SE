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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { orderStore, Order } from "../../utils/orderStore";

const { width, height } = Dimensions.get("window");

interface UserData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<UserData>({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+63 912 345 6789",
    address: "123 Main Street, Cagayan de Oro City",
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState<UserData>(user);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders on mount and subscribe to changes
  useEffect(() => {
    setOrders(orderStore.getOrders());

    const unsubscribe = orderStore.subscribe(() => {
      setOrders(orderStore.getOrders());
    });

    return () => unsubscribe();
  }, []);

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

  const openEditModal = () => {
    setEditedUser(user);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditedUser(user);
  };

  const saveProfile = () => {
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
    if (!editedUser.address.trim()) {
      alert("Address cannot be empty");
      return;
    }

    setUser(editedUser);
    setEditModalVisible(false);
    alert("Profile updated successfully!");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.12 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardBg} />
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <View style={styles.avatarGlow} />
              <Ionicons name="person" size={54} color="#94665B" />
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8}>
              <Ionicons name="camera" size={18} color="#fff" />
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
              <View style={styles.iconWrapper}>
                <Ionicons name="call-outline" size={22} color="#94665B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.iconWrapper}>
                <Ionicons name="location-outline" size={22} color="#94665B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{user.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/orders/OrderHistory")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Ionicons name="receipt-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyOrdersText}>No orders yet</Text>
              <Text style={styles.emptyOrdersSubtext}>
                Book a service to see your orders here
              </Text>
            </View>
          ) : (
            orders.slice(0, 3).map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNo}>{order.orderNo}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + "20" },
                    ]}
                  >
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

                <View style={styles.orderDetails}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderService}>{order.service}</Text>
                    <Text style={styles.orderItem}>{order.item}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <View style={styles.orderPriceContainer}>
                    <Text style={styles.orderPrice}>₱{order.price}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => router.push(`/orders/${order.id}`)}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94665B" />
                </TouchableOpacity>
              </View>
            ))
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
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeEditModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeEditModal}>
                  <View style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#1F2937" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalAvatarSection}>
                  <View style={styles.modalAvatar}>
                    <View style={styles.avatarGlow} />
                    <Ionicons name="person" size={54} color="#94665B" />
                  </View>
                  <TouchableOpacity style={styles.changePhotoBtn}>
                    <Ionicons name="camera" size={18} color="#94665B" />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>

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
                        onChangeText={(t) =>
                          setEditedUser({ ...editedUser, name: t })
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
                        onChangeText={(t) =>
                          setEditedUser({ ...editedUser, email: t })
                        }
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </View>

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
                        onChangeText={(t) =>
                          setEditedUser({ ...editedUser, phone: t })
                        }
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Address *</Text>
                    <View
                      style={[styles.inputContainer, styles.textAreaContainer]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color="#94665B"
                        style={styles.textAreaIcon}
                      />
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={editedUser.address}
                        onChangeText={(t) =>
                          setEditedUser({ ...editedUser, address: t })
                        }
                        placeholder="Enter your complete address"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>

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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navItemWrap}>
          <TouchableOpacity onPress={() => router.replace("/home")}>
            <View style={styles.navItemWrap}>
              <Ionicons name="home" size={22} color="#9CA3AF" />
              <Text style={styles.navLabel}>Home</Text>
            </View>
          </TouchableOpacity>
        </View>

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
          <View style={styles.cartBadgeContainer}>
            <Ionicons name="cart-outline" size={22} color="#64748B" />
          </View>
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("../UserProfile/profile")}
          style={styles.navItemWrapActive}
        >
          <Ionicons name="person-outline" size={22} color="#78350F" />
          <Text style={styles.navLabelActive}>Profile</Text>
        </TouchableOpacity>
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
    justifyContent: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: width * 0.05,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#94665B",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
  },
  profileCardBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "#FEF3C7",
    opacity: 0.3,
  },
  avatarContainer: { position: "relative", marginBottom: 20 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#94665B",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F5ECE3",
    borderRadius: 55,
    opacity: 0.5,
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#94665B",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 20,
    fontWeight: "500",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 24,
  },
  editProfileText: { color: "#94665B", fontWeight: "700", fontSize: 15 },

  section: { marginHorizontal: width * 0.05, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
  },
  viewAllText: { fontSize: 14, color: "#94665B", fontWeight: "700" },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#94665B",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1, paddingTop: 4 },
  infoLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    lineHeight: 22,
  },
  modalAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#94665B",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  closeButton: {},
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
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
  orderNo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
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
  orderPriceContainer: {
    justifyContent: "center",
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#94665B",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#94665B",
    fontWeight: "600",
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
    backgroundColor: "transparent",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.92,
    paddingBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },

  modalAvatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    marginTop: 8,
  },

  changePhotoText: {
    color: "#94665B",
    fontWeight: "700",
    fontSize: 15,
  },

  formSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  formSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 14,
  },

  textAreaContainer: {
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 12,
  },

  textAreaIcon: {
    marginTop: 8,
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
  },

  saveButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#94665B",
    borderRadius: 16,
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
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
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  navItemWrap: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 4,
  },
  navItemWrapActive: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  navLabelActive: {
    fontSize: 11,
    color: "#78350F",
    fontWeight: "700",
  },
  cartBadgeContainer: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
