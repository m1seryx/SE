import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Image,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { cartStore, CartItem } from "../../utils/cartStore";
import { orderStore } from "../../utils/orderStore";
import { LinearGradient } from "expo-linear-gradient";

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);

  useEffect(() => {
    const update = () => setCartItems(cartStore.getItems());
    update();
    const unsubscribe = cartStore.subscribe(update);
    return () => unsubscribe();
  }, []);

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(
      selectedItems.length === cartItems.length && cartItems.length > 0
        ? []
        : cartItems.map((item) => item.id)
    );
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert(
        "No Items Selected",
        "Please select at least one service to book."
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmBooking = () => {
    const selected = cartItems.filter((item) =>
      selectedItems.includes(item.id)
    );

    selected.forEach((item) => {
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return "To be scheduled";
        try {
          const date = new Date(dateStr);
          return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
        } catch {
          return "Invalid date";
        }
      };

      orderStore.addOrder({
        service: item.service,
        item: item.item,
        description: item.description,
        price: item.price,
        status: "Pending",
        estimatedCompletion: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        garmentType: item.garmentType,
        damageType: item.damageType,
        specialInstructions: item.specialInstructions,
        clothingBrand: item.clothingBrand,
        quantity: item.quantity,
        image: item.image,
        appointmentDate: formatDate(item.appointmentDate),
      });
    });

    selectedItems.forEach((id) => cartStore.removeItem(id));
    setSelectedItems([]);
    setShowConfirmModal(false);

    Alert.alert(
      "Booked Successfully!",
      "Your appointment has been confirmed!",
      [{ text: "OK", onPress: () => router.replace("/home") }]
    );
  };

  const openDetails = (item: CartItem) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert("Remove Item", "Remove this service from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          cartStore.removeItem(id);
          setSelectedItems((prev) => prev.filter((i) => i !== id));
        },
      },
    ]);
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return "Not scheduled yet";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="cart" size={26} color="#F59E0B" />
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <TouchableOpacity onPress={selectAllItems}>
          <Text style={styles.selectAllText}>
            {selectedItems.length === cartItems.length && cartItems.length > 0
              ? "Deselect All"
              : "Select All"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add services to get started
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.replace("/home")}
            >
              <Text style={styles.shopButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            <View style={styles.cartList}>
              {cartItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.cartItem,
                    selectedItems.includes(item.id) && styles.cartItemSelected,
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", paddingRight: 60 }}
                    onPress={() => toggleItemSelection(item.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.checkbox}>
                      {selectedItems.includes(item.id) && (
                        <Ionicons name="checkmark" size={20} color="#78350F" />
                      )}
                    </View>

                    <View style={styles.iconWrapper}>
                      <Ionicons
                        name={item.icon as any}
                        size={34}
                        color="#78350F"
                      />
                    </View>

                    <View style={styles.itemInfo}>
                      <Text style={styles.serviceTag}>{item.service}</Text>
                      <Text style={styles.itemTitle}>{item.item}</Text>
                      <Text style={styles.itemDesc} numberOfLines={2}>
                        {item.description}
                      </Text>

                      {item.appointmentDate && (
                        <View style={styles.dateTag}>
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color="#78350F"
                          />
                          <Text style={styles.dateText}>
                            {formatDisplayDate(item.appointmentDate)}
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.detailsLink}
                        onPress={(e) => {
                          e.stopPropagation();
                          openDetails(item);
                        }}
                      >
                        <Text style={styles.detailsLinkText}>View Details</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#78350F"
                        />
                      </TouchableOpacity>

                      <Text style={styles.price}>
                        ₱{item.price.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeBtnContainer}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <View style={styles.removeBtn}>
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color="#FFFFFF"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Selected Items</Text>
                <Text style={styles.summaryValue}>{selectedItems.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  ₱{getSelectedTotal().toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Fee</Text>
                <Text style={styles.summaryValue}>₱50</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalPrice}>
                  ₱{(getSelectedTotal() + 50).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Checkout Bar */}
            <View style={styles.checkoutSection}>
              <View style={styles.checkoutBar}>
                <View>
                  <Text style={styles.checkoutItems}>
                    {selectedItems.length}{" "}
                    {selectedItems.length === 1 ? "item" : "items"} selected
                  </Text>
                  <Text style={styles.checkoutAmount}>
                    ₱{(getSelectedTotal() + 50).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.checkoutBtn,
                    selectedItems.length === 0 && styles.checkoutBtnDisabled,
                  ]}
                  onPress={handleCheckout}
                  disabled={selectedItems.length === 0}
                  activeOpacity={0.9}
                >
                  <Text style={styles.checkoutBtnText}>Book</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.modalIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            <Text style={styles.modalText}>
              You are about to book {selectedItems.length} service
              {selectedItems.length > 1 ? "s" : ""}.
            </Text>
            <View style={styles.modalTotalBox}>
              <Text style={styles.modalTotalLabel}>Total Amount</Text>
              <Text style={styles.modalTotalPrice}>
                ₱{(getSelectedTotal() + 50).toLocaleString()}
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmBooking}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Item Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="slide">
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsModal}>
            <LinearGradient
              colors={["#78350F", "#92400E"]}
              style={styles.detailsHeader}
            >
              <Text style={styles.detailsTitle}>Service Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  <View style={styles.imageWrapper}>
                    {selectedItem.image ? (
                      <Image
                        source={{ uri: selectedItem.image }}
                        style={styles.detailsImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noImage}>
                        <Ionicons
                          name="image-outline"
                          size={90}
                          color="#94a3b8"
                        />
                        <Text style={styles.noImageText}>No Photo</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailsCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Order Summary</Text>
                      <Text style={styles.cardSubtitle}>
                        All details for your selected service
                      </Text>
                      <View style={styles.decorativeLine} />
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Service Type</Text>
                      <Text style={styles.detailValue}>
                        {selectedItem.service}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Item</Text>
                      <Text style={styles.detailValue}>
                        {selectedItem.item}
                      </Text>
                    </View>

                    {selectedItem.appointmentDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Appointment</Text>
                        <Text style={styles.detailValue}>
                          {formatDisplayDate(selectedItem.appointmentDate)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.priceSection}>
                      <Text style={styles.priceLabel}>Total Amount</Text>
                      <Text style={styles.detailPrice}>
                        ₱{selectedItem.price.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </>
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.replace("/home")}>
          <Ionicons name="home-outline" size={26} color="#9CA3AF" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/(tabs)/appointment/appointmentSelection")
          }
        >
          <Ionicons name="calendar-outline" size={26} color="#9CA3AF" />
          <Text style={styles.navLabel}>Book</Text>
        </TouchableOpacity>

        <View style={styles.navItemActive}>
          <Ionicons name="cart" size={26} color="#78350F" />
          <Text style={styles.navLabelActive}>Cart</Text>
        </View>

        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <Ionicons name="person-outline" size={26} color="#9CA3AF" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---------- STYLES (unchanged) ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF9" },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F4",
  },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  selectAllText: { fontSize: 15, fontWeight: "700", color: "#78350F" },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 16, color: "#64748B", marginBottom: 32 },
  shopButton: {
    backgroundColor: "#78350F",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#78350F",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  shopButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  cartList: { paddingHorizontal: 20, paddingTop: 10 },
  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cartItemSelected: { borderColor: "#78350F", backgroundColor: "#FFFBEB" },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemInfo: { flex: 1 },
  serviceTag: {
    fontSize: 13,
    color: "#F59E0B",
    fontWeight: "700",
    backgroundColor: "#FFF7ED",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  itemDesc: { fontSize: 14, color: "#64748B", lineHeight: 20, marginBottom: 8 },
  dateTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 12,
  },
  dateText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#78350F",
    fontWeight: "600",
  },
  detailsLink: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  detailsLinkText: { fontSize: 14, color: "#78350F", fontWeight: "700" },
  price: { fontSize: 22, fontWeight: "900", color: "#78350F" },

  removeBtnContainer: { position: "absolute", right: 16, top: 16 },
  removeBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#EF4444",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },

  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  summaryLabel: { fontSize: 16, color: "#64748B" },
  summaryValue: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  totalPrice: { fontSize: 28, fontWeight: "900", color: "#F59E0B" },

  checkoutSection: { paddingHorizontal: 20, paddingBottom: 40 },
  checkoutBar: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 25,
    elevation: 18,
  },
  checkoutItems: { fontSize: 16, color: "#64748B", fontWeight: "600" },
  checkoutAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: "#78350F",
    marginTop: 6,
  },
  checkoutBtn: {
    backgroundColor: "#78350F",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkoutBtnDisabled: { backgroundColor: "#94A3B8" },
  checkoutBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 26, fontWeight: "800", color: "#1F2937" },
  modalText: {
    fontSize: 17,
    color: "#64748B",
    textAlign: "center",
    marginVertical: 16,
  },
  modalTotalBox: {
    backgroundColor: "#FFF7ED",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  modalTotalLabel: { fontSize: 18, color: "#78350F", fontWeight: "600" },
  modalTotalPrice: { fontSize: 28, fontWeight: "900", color: "#F59E0B" },
  modalButtons: { flexDirection: "row", gap: 16, width: "100%" },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalCancelText: { color: "#6B7280", fontWeight: "600", fontSize: 17 },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#78350F",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalConfirmText: { color: "#FFFFFF", fontWeight: "700", fontSize: 17 },

  detailsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  detailsModal: {
    backgroundColor: "#fafafa",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "94%",
    overflow: "hidden",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 24,
    paddingTop: 40,
  },
  detailsTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF" },

  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    padding: 20,
    paddingBottom: 10,
  },
  detailsImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  noImage: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 28,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    marginTop: 16,
    fontSize: 18,
    color: "#64748b",
    fontWeight: "600",
  },

  detailsCard: {
    marginHorizontal: 20,
    marginTop: -40,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    padding: 32,
    paddingTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 35,
    elevation: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: { alignItems: "center", marginBottom: 32 },
  cardTitle: { fontSize: 28, fontWeight: "900", color: "#1e293b" },
  cardSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 10,
    textAlign: "center",
  },
  decorativeLine: {
    width: 90,
    height: 6,
    backgroundColor: "#F59E0B",
    borderRadius: 3,
    marginTop: 20,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: { fontSize: 16, color: "#64748b", fontWeight: "600" },
  detailValue: {
    fontSize: 17,
    color: "#1e293b",
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },

  priceSection: {
    marginTop: 30,
    paddingTop: 30,
    borderTopWidth: 3,
    borderTopColor: "#FEF3C7",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#78350F",
    marginBottom: 12,
  },
  detailPrice: { fontSize: 42, fontWeight: "900", color: "#F59E0B" },

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
  navLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  navLabelActive: { fontSize: 11, color: "#78350F", fontWeight: "700" },
  navItemActive: { alignItems: "center" },
});
