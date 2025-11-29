// app/(tabs)/cart/cart.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width, height } = Dimensions.get("window");

interface CartItem {
  id: string;
  service: string;
  item: string;
  description: string;
  price: number;
  icon: any;
}

export default function CartScreen() {
  const router = useRouter();

  const [cartItems] = useState<CartItem[]>([
    {
      id: "1",
      service: "Repair Service",
      item: "Dress Pants",
      description: "Hem adjustment and zipper replacement",
      price: 350,
      icon: "construct-outline",
    },
    {
      id: "2",
      service: "Customize Service",
      item: "Barong Tagalog",
      description: "Custom embroidery and fitting",
      price: 2500,
      icon: "shirt-outline",
    },
    {
      id: "3",
      service: "Dry Cleaning",
      item: "Black Suit",
      description: "Professional dry cleaning service",
      price: 450,
      icon: "water-outline",
    },
  ]);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one service");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmBooking = () => {
    setShowConfirmModal(false);
    alert("Appointment booked successfully!");
    router.push("/home");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }} // ← THIS FIXES EVERYTHING
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <TouchableOpacity onPress={selectAllItems}>
            <Text style={styles.selectAllText}>
              {selectedItems.length === cartItems.length
                ? "Deselect"
                : "Select All"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={100} color="#D1D5DB" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.shopButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items List */}
            <View style={styles.cartList}>
              {cartItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.cartItem,
                    selectedItems.includes(item.id) && styles.cartItemSelected,
                  ]}
                  onPress={() => toggleItemSelection(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkboxContainer}>
                    <View
                      style={[
                        styles.checkbox,
                        selectedItems.includes(item.id) &&
                          styles.checkboxChecked,
                      ]}
                    >
                      {selectedItems.includes(item.id) && (
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      )}
                    </View>
                  </View>

                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={32} color="#94665B" />
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.serviceType}>{item.service}</Text>
                    <Text style={styles.itemName}>{item.item}</Text>
                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>
                    <Text style={styles.itemPrice}>
                      ₱{item.price.toLocaleString()}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>

            {/* Appointment Date */}
            <View style={styles.dateSection}>
              <View style={styles.dateSectionHeader}>
                <Ionicons name="calendar-outline" size={26} color="#94665B" />
                <Text style={styles.dateSectionTitle}>
                  Select Appointment Date
                </Text>
              </View>

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.datePickerContent}>
                  <Ionicons name="calendar" size={22} color="#94665B" />
                  <Text style={styles.datePickerText}>
                    {formatDate(selectedDate)}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={22} color="#9CA3AF" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Order Summary */}
            <View style={styles.summarySection}>
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

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  ₱{(getSelectedTotal() + 50).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Extra space so nothing gets cut off */}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* FIXED BOTTOM CHECKOUT BAR */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutLabel}>
              {selectedItems.length}{" "}
              {selectedItems.length === 1 ? "item" : "items"} selected
            </Text>
            <Text style={styles.checkoutTotal}>
              ₱{(getSelectedTotal() + 50).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              selectedItems.length === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={selectedItems.length === 0}
          >
            <Text style={styles.checkoutButtonText}>Book Appointment</Text>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="calendar-outline" size={48} color="#94665B" />
            </View>
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            <Text style={styles.modalText}>
              You are booking {selectedItems.length} service
              {selectedItems.length > 1 ? "s" : ""}
            </Text>
            <Text style={styles.modalDate}>{formatDate(selectedDate)}</Text>

            <View style={styles.modalTotal}>
              <Text style={styles.modalTotalLabel}>Total Amount:</Text>
              <Text style={styles.modalTotalValue}>
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
                <Text style={styles.modalConfirmText}>Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/home")}>
          <Ionicons name="home-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/appointment/AppointmentScreen")}
        >
          <Ionicons name="receipt-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="cart" size={26} color="#94665B" />
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
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  selectAllText: { fontSize: 15, fontWeight: "600", color: "#94665B" },

  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyCartText: {
    fontSize: 20,
    color: "#6B7280",
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: "#94665B",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
  },
  shopButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  cartList: { paddingHorizontal: 20, paddingTop: 10 },
  cartItem: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cartItemSelected: { borderColor: "#94665B", backgroundColor: "#FDF4F0" },

  checkboxContainer: { marginRight: 16 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#94665B", borderColor: "#94665B" },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDF4F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemDetails: { flex: 1 },
  serviceType: {
    fontSize: 13,
    color: "#94665B",
    fontWeight: "600",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  itemPrice: { fontSize: 20, fontWeight: "800", color: "#94665B" },

  removeButton: { padding: 10 },

  dateSection: { marginHorizontal: 20, marginVertical: 24 },
  dateSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateSectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 12,
  },
  datePickerButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  datePickerContent: { flexDirection: "row", alignItems: "center" },
  datePickerText: {
    fontSize: 17,
    color: "#1F2937",
    marginLeft: 12,
    fontWeight: "500",
  },

  summarySection: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryLabel: { fontSize: 16, color: "#6B7280" },
  summaryValue: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  totalLabel: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  totalValue: { fontSize: 26, fontWeight: "800", color: "#94665B" },

  checkoutContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  checkoutInfo: { marginBottom: 16 },
  checkoutLabel: { fontSize: 15, color: "#6B7280" },
  checkoutTotal: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 4,
  },
  checkoutButton: {
    backgroundColor: "#94665B",
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutButtonDisabled: { backgroundColor: "#D1D5DB" },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FDF4F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 20,
    fontWeight: "700",
    color: "#94665B",
    marginBottom: 24,
  },
  modalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  modalTotalLabel: { fontSize: 18, color: "#6B7280" },
  modalTotalValue: { fontSize: 28, fontWeight: "800", color: "#94665B" },
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
    backgroundColor: "#94665B",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontWeight: "700", fontSize: 17 },

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
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 15,
  },
});
