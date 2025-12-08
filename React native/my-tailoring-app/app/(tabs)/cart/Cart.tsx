// app/(tabs)/cart/Cart.tsx
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
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CartItem } from "../../../utils/cartStore";
import { orderStore } from "../../../utils/orderStore";
import { cartService } from "../../../utils/apiService";

const { height } = Dimensions.get("window");

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] =
    useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch cart items from backend
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      console.log('Raw cart response from backend:', response);
      if (response.success) {
        console.log('Cart items from backend:', response.items);
        // Transform backend cart items to match frontend CartItem interface
        const transformedItems = response.items.map((item: any) => {
          console.log('Processing cart item:', item);
          console.log('Specific data:', item.specific_data);
          console.log('Image URL from backend:', item.specific_data?.imageUrl);
          
          const API_BASE = 'http://192.168.254.102:5000';
          const imageUrl = item.specific_data?.imageUrl;
          let processedImage = '';
          if (imageUrl && imageUrl !== 'no-image') {
            processedImage = imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;
          }
          
          // Format the date nicely
          const rawDate = item.specific_data?.pickupDate || item.specific_data?.preferredDate || item.appointment_date;
          let formattedDate = '';
          if (rawDate) {
            try {
              const date = new Date(rawDate);
              formattedDate = date.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            } catch (e) {
              formattedDate = rawDate;
            }
          }
          
          return {
            id: item.cart_id,
            service: item.service_type,
            item: item.specific_data?.serviceName || item.service_type || 'Service',
            description: item.specific_data?.damageDescription || item.specific_data?.specialInstructions || '',
            price: parseFloat(item.final_price) || 0,
            icon: getServiceIcon(item.service_type),
            garmentType: item.specific_data?.garmentType || '',
            damageType: item.specific_data?.damageLevel || item.specific_data?.damageType || '',
            specialInstructions: item.specific_data?.specialInstructions || '',
            image: processedImage,
            appointmentDate: formattedDate,
            // Additional fields for detailed view
            clothingBrand: item.specific_data?.clothingBrand || '',
            quantity: item.specific_data?.quantity || 1,
            fabricType: item.specific_data?.fabricType || '',
            style: item.specific_data?.style || '',
            buttonStyle: item.specific_data?.buttonStyle || '',
            sizeMeasurement: item.specific_data?.sizeMeasurement || '',
            basePrice: parseFloat(item.base_price) || 0,
          };
        });
        console.log('Transformed cart items:', transformedItems);
        setCartItems(transformedItems);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
      Alert.alert("Error", "Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };
  
  const getServiceIcon = (serviceType: string): string => {
    switch (serviceType?.toLowerCase()) {
      case 'dry_cleaning':
        return 'water-outline';
      case 'customize':
        return 'color-palette-outline';
      case 'repair':
        return 'construct-outline';
      case 'rental':
        return 'shirt-outline';
      default:
        return 'shirt-outline';
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(
      selectedItems.length === cartItems.length
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
      alert("Please select at least one service");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    try {
      // Submit cart to create order
      const response = await cartService.submitCart();
      if (response.success) {
        // Add items to order store for local tracking
        const selectedCartItems = cartItems.filter((item) =>
          selectedItems.includes(item.id)
        );

        selectedCartItems.forEach((item) => {
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
            appointmentDate: item.appointmentDate || "Not specified",
          });
        });

        // Remove items from local cart state
        setSelectedItems([]);
        setCartItems(prev => prev.filter(item => !selectedItems.includes(item.id)));

        Alert.alert("Success", "Appointment booked successfully! Check your order history.");
        setShowConfirmModal(false);
        router.push("/home");
      } else {
        Alert.alert("Error", response.message || "Failed to submit cart");
      }
    } catch (error) {
      console.error("Error submitting cart:", error);
      Alert.alert("Error", "Failed to submit cart");
    }
  };

  const showItemDetails = (item: any) => {
    console.log('Showing item details:', item);
    console.log('Image URL:', item.image);
    setSelectedItemDetails(item);
    setShowDetailsModal(true);
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const response = await cartService.removeFromCart(id);
      if (response.success) {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
        setSelectedItems((prev) => prev.filter((i) => i !== id));
        Alert.alert("Success", "Item removed from cart");
      } else {
        Alert.alert("Error", response.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      Alert.alert("Error", "Failed to remove item");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <TouchableOpacity onPress={selectAllItems}>
            <Text style={styles.selectAllText}>
              {selectedItems.length === cartItems.length && cartItems.length > 0
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
                  {/* Checkbox */}
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

                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={item.icon as any}
                      size={32}
                      color="#94665B"
                    />
                  </View>

                  {/* Details */}
                  <View style={styles.itemDetails}>
                    <Text style={styles.serviceType}>{item.service}</Text>
                    <Text style={styles.itemName}>{item.item}</Text>
                    {item.garmentType && (
                      <Text style={styles.itemGarment}>
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.garmentType}
                      </Text>
                    )}
                    {item.description && (
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}

                    {/* Appointment Tag */}
                    {item.appointmentDate && (
                      <View style={styles.appointmentTag}>
                        <Ionicons name="calendar" size={16} color="#94665B" />
                        <Text style={styles.appointmentText}>
                          {item.appointmentDate}
                        </Text>
                      </View>
                    )}

                    {/* View Details – Now Clickable! */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation(); // ← Stops parent onPress
                        showItemDetails(item);
                      }}
                      style={styles.viewDetailsLink}
                    >
                      <Text style={styles.viewDetailsLinkText}>
                        View Details
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#94665B"
                      />
                    </TouchableOpacity>

                    {/* Only show price for rental, or if admin confirmed price */}
                    {item.service?.toLowerCase() === 'rental' ? (
                      <Text style={styles.itemPrice}>
                        ₱{item.price.toLocaleString()}
                      </Text>
                    ) : (
                      <Text style={styles.itemPricePending}>
                        Price: To be confirmed
                      </Text>
                    )}
                  </View>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.id);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
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
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  ₱{getSelectedTotal().toLocaleString()}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ==================== ITEM DETAILS MODAL (FIXED & BEAUTIFUL) ==================== */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>Service Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItemDetails && (
                <>
                  {selectedItemDetails.image && selectedItemDetails.image !== 'no-image' && selectedItemDetails.image.trim() !== '' && !selectedItemDetails.image.includes('no-image') ? (
                    <Image
                      source={{ uri: selectedItemDetails.image }}
                      style={styles.detailsImage}
                      onError={(error) => {
                        console.log('Image load error:', error);
                        console.log('Failed to load image URL:', selectedItemDetails.image);
                      }}
                      onLoad={() => console.log('Image loaded successfully:', selectedItemDetails.image)}
                    />
                  ) : (
                    <View style={[styles.detailsImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}> 
                      <Text style={{ color: '#666' }}>No image available</Text>
                    </View>
                  )}

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Service</Text>
                    <Text style={styles.detailsValue}>
                      {selectedItemDetails.service}
                    </Text>
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Item</Text>
                    <Text style={styles.detailsValue}>
                      {selectedItemDetails.item}
                    </Text>
                  </View>

                  {selectedItemDetails.garmentType && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Garment Type</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.garmentType}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.quantity > 1 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Quantity</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.quantity}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.clothingBrand && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Clothing Brand</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.clothingBrand}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.fabricType && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Fabric Type</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.fabricType}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.style && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Style</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.style}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.buttonStyle && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Button Style</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.buttonStyle}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.sizeMeasurement && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Size Measurement</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.sizeMeasurement}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.damageType && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Type of Damage</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.damageType}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.appointmentDate && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>Preferred Date & Time</Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.appointmentDate}
                      </Text>
                    </View>
                  )}

                  {selectedItemDetails.specialInstructions && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsLabel}>
                        Special Instructions
                      </Text>
                      <Text style={styles.detailsValue}>
                        {selectedItemDetails.specialInstructions}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsLabel}>Price</Text>
                    <Text style={styles.detailsPriceValue}>
                      ₱{selectedItemDetails.price.toLocaleString()}
                    </Text>
                  </View>
                </>
              )}
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

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

            <View style={{ width: "100%", marginVertical: 16 }}>
              {cartItems
                .filter((item) => selectedItems.includes(item.id))
                .map((item) => (
                  <Text key={item.id} style={styles.modalItemDate}>
                    • {item.item}: {item.appointmentDate || "No date set"}
                  </Text>
                ))}
            </View>

            <View style={styles.modalTotal}>
              <Text style={styles.modalTotalLabel}>Total Amount:</Text>
              <Text style={styles.modalTotalValue}>
                ₱{getSelectedTotal().toLocaleString()}
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

      {/* Checkout Bar */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutLabel}>
              {selectedItems.length}{" "}
              {selectedItems.length === 1 ? "item" : "items"} selected
            </Text>
            <Text style={styles.checkoutTotal}>
              ₱
              {getSelectedTotal().toLocaleString()}
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

        <View style={styles.navItemWrapActive}>
          <Ionicons name="cart-outline" size={20} color="#7A5A00" />
        </View>

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
  itemGarment: {
    fontSize: 14,
    color: "#94665B",
    fontWeight: "500",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 6,
  },
  appointmentTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF4F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  appointmentText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#94665B",
    fontWeight: "600",
  },
  viewDetailsLink: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  viewDetailsLinkText: {
    fontSize: 13,
    color: "#94665B",
    fontWeight: "600",
    marginRight: 4,
  },
  itemPrice: { fontSize: 20, fontWeight: "800", color: "#94665B" },
  itemPricePending: { fontSize: 14, fontWeight: "600", color: "#F59E0B", fontStyle: "italic" },
  removeButton: { padding: 10 },
  cancelButtonText: { 
    color: "#EF4444", 
    fontSize: 14, 
    fontWeight: "600" 
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
    marginTop: 10,
    marginBottom: 100,
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

  // Fixed Details Modal
  detailsModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.88,
    width: "100%",
    marginTop: "auto",
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailsModalTitle: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  detailsImage: { width: "100%", height: 250, resizeMode: "cover" },
  detailsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  detailsValue: { fontSize: 17, color: "#1F2937", fontWeight: "500" },
  detailsPriceValue: { fontSize: 24, fontWeight: "800", color: "#94665B" },

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
  modalItemDate: {
    fontSize: 15,
    color: "#4B5563",
    marginVertical: 4,
    textAlign: "left",
  },
});
