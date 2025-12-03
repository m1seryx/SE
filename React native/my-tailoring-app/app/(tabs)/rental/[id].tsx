// app/(tabs)/rental/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { rentalService } from "../../utils/rentalService";
import { cartService } from "../../utils/apiService";

export default function RentalDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  const today = new Date();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch rental item details
  useEffect(() => {
    if (id) {
      fetchRentalDetails();
    }
  }, [id]);

  const fetchRentalDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await rentalService.getRentalById(id as string);
      console.log('Rental details:', result);
      
      if (result.item) {
        setItem(result.item);
      } else {
        setError('Rental item not found');
      }
    } catch (err) {
      console.error('Error fetching rental:', err);
      setError('Failed to load rental details');
    } finally {
      setLoading(false);
    }
  };

  const getImageSource = () => {
    if (item?.image_url) {
      const imageUrl = rentalService.getImageUrl(item.image_url);
      if (imageUrl) {
        return { uri: imageUrl };
      }
    }
    return require("../../../assets/images/rent.jpg");
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#94665B" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading rental details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#EF4444', fontSize: 16 }}>{error || 'Item not found'}</Text>
        <TouchableOpacity 
          style={{ marginTop: 16, backgroundColor: '#94665B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          onPress={() => router.push('/rental')}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Back to Rentals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safe format function — never crashes
  const formatDate = (date: Date | null): string => {
    if (!date) return "Not selected";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRentalDays = (): number => {
    if (!startDate || !endDate) return 0;
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // inclusive count
  };

  const calculateTotal = () => {
    const days = getRentalDays();
    const dailyRate = parseFloat(item.daily_rate) || 0;
    const baseFee = parseFloat(item.base_rental_fee) || 0;
    return baseFee + (dailyRate * days);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    if (tempStartDate) {
      marked[tempStartDate.toISOString().split("T")[0]] = {
        startingDay: true,
        color: "#94665B",
        textColor: "white",
      };
    }
    if (tempEndDate && tempStartDate && tempEndDate >= tempStartDate) {
      let current = new Date(tempStartDate);
      current.setDate(current.getDate() + 1);
      while (current < tempEndDate) {
        marked[current.toISOString().split("T")[0]] = {
          color: "#FDF4F0",
          textColor: "#94665B",
        };
        current.setDate(current.getDate() + 1);
      }
      marked[tempEndDate.toISOString().split("T")[0]] = {
        endingDay: true,
        color: "#94665B",
        textColor: "white",
      };
    }
    return marked;
  };

  const handleDayPress = (day: any) => {
    const selected = new Date(day.dateString);

    if (!tempStartDate || tempEndDate) {
      setTempStartDate(selected);
      setTempEndDate(null);
    } else {
      if (selected < tempStartDate!) {
        setTempStartDate(selected);
      } else {
        setTempEndDate(selected);
      }
    }
  };

  const applyDates = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowCalendar(false);
  };

  const handleAddToCart = () => {
    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please select both start and end dates");
      return;
    }
    if (getRentalDays() > 30) {
      Alert.alert("Too Long", "Maximum rental period is 30 days");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmAddToCart = async () => {
    try {
      setAddingToCart(true);
      const days = getRentalDays();
      const totalPrice = calculateTotal();

      const rentalData = {
        serviceType: 'rental',
        serviceId: item.item_id,
        quantity: 1,
        basePrice: item.base_rental_fee || '0',
        finalPrice: totalPrice.toString(),
        pricingFactors: {
          daily_rate: item.daily_rate || '0',
          days: days,
          deposit_amount: item.deposit_amount || '0'
        },
        specificData: {
          item_name: item.item_name,
          brand: item.brand || '',
          size: item.size || '',
          category: item.category || '',
          image_url: item.image_url
        },
        rentalDates: {
          startDate: startDate!.toISOString().split('T')[0],
          endDate: endDate!.toISOString().split('T')[0]
        }
      };

      const result = await cartService.addToCart(rentalData);
      
      if (result.success) {
        setShowConfirmModal(false);
        Alert.alert("Success!", "Rental added to cart!", [
          { text: "View Cart", onPress: () => router.push("/(tabs)/cart/Cart") },
          { text: "Continue", onPress: () => router.push("/rental") },
        ]);
      } else {
        Alert.alert("Error", result.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert("Error", "Failed to add rental to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/rental")}
      >
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <Image source={getImageSource()} style={styles.image} resizeMode="cover" />

      <View style={styles.sheet}>
        <View style={styles.titlePill}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {item.item_name}
          </Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Rental Price</Text>
          <Text style={styles.priceValue}>₱{item.daily_rate}/day</Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {item.size && (
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={20} color="#94665B" />
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{item.size}</Text>
            </View>
          )}
          {item.material && (
            <View style={styles.detailItem}>
              <Ionicons name="shirt-outline" size={20} color="#94665B" />
              <Text style={styles.detailLabel}>Material</Text>
              <Text style={styles.detailValue}>{item.material}</Text>
            </View>
          )}
          {item.color && (
            <View style={styles.detailItem}>
              <Ionicons name="color-palette-outline" size={20} color="#94665B" />
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{item.color}</Text>
            </View>
          )}
          {item.brand && (
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={20} color="#94665B" />
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>{item.brand}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {item.description && (
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>Description</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        )}

        {/* Calendar Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rental Period</Text>

          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => {
              setTempStartDate(startDate);
              setTempEndDate(endDate);
              setShowCalendar(true);
            }}
          >
            <Ionicons name="calendar-outline" size={22} color="#94665B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              {startDate && endDate ? (
                <>
                  <Text style={styles.dateText}>
                    {formatDate(startDate)} → {formatDate(endDate)}
                  </Text>
                  <Text style={styles.daysText}>
                    {getRentalDays()} day{getRentalDays() > 1 ? "s" : ""}{" "}
                    selected
                  </Text>
                </>
              ) : (
                <Text style={styles.placeholderText}>Tap to select dates</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {startDate && endDate && (
            <View style={styles.paymentDetailsSection}>
              <Text style={styles.paymentTitle}>Payment Details</Text>
              
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Security Deposit (Due Upon Pick Up):</Text>
                <Text style={styles.paymentValue}>₱{parseFloat(item.deposit_amount || '0').toLocaleString()}</Text>
              </View>
              
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Base Fee:</Text>
                <Text style={styles.paymentValue}>₱{parseFloat(item.base_rental_fee || '0').toLocaleString()}</Text>
              </View>
              
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>
                  Daily Rate (₱{item.daily_rate} × {getRentalDays()} day{getRentalDays() > 1 ? 's' : ''}):
                </Text>
                <Text style={styles.paymentValue}>
                  ₱{(parseFloat(item.daily_rate || '0') * getRentalDays()).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.paymentDivider} />
              
              <View style={styles.paymentTotal}>
                <Text style={styles.paymentTotalLabel}>Total Rental Cost (Due on Return):</Text>
                <Text style={styles.paymentTotalValue}>₱{calculateTotal().toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.rentBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.rentBtnText}>ADD TO CART</Text>
        </TouchableOpacity>

        <View style={styles.additionalInfo}>
          <Text style={styles.infoTitle}>Rental Info</Text>
          <Text style={styles.infoText}>• Min: 1 day | Max: 30 days</Text>
          <Text style={styles.infoText}>• Late fee: ₱100/day</Text>
          <Text style={styles.infoText}>• Deposit: ₱{parseFloat(item.deposit_amount || '0').toLocaleString()} (refundable)</Text>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide">
        <View style={styles.calendarModal}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>Select Dates</Text>
            <TouchableOpacity
              onPress={applyDates}
              disabled={!tempStartDate || !tempEndDate}
            >
              <Text
                style={[
                  styles.doneText,
                  (!tempStartDate || !tempEndDate) && { color: "#ccc" },
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <Calendar
            minDate={today.toISOString().split("T")[0]}
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType="period"
            theme={{
              selectedDayBackgroundColor: "#94665B",
              todayTextColor: "#94665B",
              arrowColor: "#94665B",
              monthTextColor: "#1F2937",
              textDayFontWeight: "600",
            }}
          />

          {tempStartDate && tempEndDate && (
            <View style={styles.selectionSummary}>
              <Text style={styles.summaryText}>
                {formatDate(tempStartDate)} → {formatDate(tempEndDate)}
              </Text>
              <Text style={styles.summaryDays}>
                {(() => {
                  const diff = tempEndDate.getTime() - tempStartDate.getTime();
                  return Math.ceil(diff / 86400000) + 1;
                })()}{" "}
                day
                {(() => {
                  const diff = tempEndDate.getTime() - tempStartDate.getTime();
                  const days = Math.ceil(diff / 86400000) + 1;
                  return days > 1 ? "s" : "";
                })()}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons
                name="calendar-clear-outline"
                size={48}
                color="#94665B"
              />
            </View>
            <Text style={styles.modalTitle}>Confirm Rental</Text>
            <Text style={styles.modalValue}>{item.item_name}</Text>
            <Text style={styles.modalValue}>
              {formatDate(startDate)} → {formatDate(endDate)}
            </Text>
            <Text style={styles.modalValue}>
              {getRentalDays()} day{getRentalDays() > 1 ? "s" : ""}
            </Text>
            <View style={styles.modalTotal}>
              <Text style={styles.modalTotalLabel}>Total</Text>
              <Text style={styles.modalTotalValue}>
                ₱{calculateTotal().toLocaleString()}
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
                onPress={confirmAddToCart}
              >
                <Text style={styles.modalConfirmText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 300,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  titlePill: {
    alignSelf: "center",
    backgroundColor: "#94665B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  priceSection: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#F5ECE3",
    borderRadius: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#94665B",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  detailItem: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 4,
  },
  descSection: {
    marginTop: 20,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    fontSize: 16,
  },
  desc: {
    color: "#6B7280",
    lineHeight: 22,
    fontSize: 14,
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  datePickerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  daysInputContainer: {
    marginBottom: 16,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  daysControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
  },
  controlBtn: {
    backgroundColor: "#fff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  daysValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginHorizontal: 32,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FDF4F0",
    padding: 16,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#94665B",
  },
  paymentDetailsSection: {
    marginTop: 16,
    backgroundColor: "#FDF4F0",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3E8DC",
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  paymentTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  paymentTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#94665B",
  },
  rentBtn: {
    marginTop: 24,
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#94665B",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    shadowColor: "#94665B",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
    gap: 10,
  },
  rentBtnText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 16,
  },
  additionalInfo: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    color: "#EF4444",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#94665B",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 24,
  },
  modalDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  modalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  modalTotalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalTotalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#94665B",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#94665B",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  calendarBtn: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  dateText: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  daysText: { fontSize: 13, color: "#94665B", marginTop: 4 },
  placeholderText: { fontSize: 15, color: "#9CA3AF" },
  calendarModal: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: Platform.OS === "ios" ? 50 : 20,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  calendarTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  doneText: { fontSize: 16, fontWeight: "600", color: "#94665B" },
  selectionSummary: {
    padding: 20,
    backgroundColor: "#FDF4F0",
    alignItems: "center",
  },
  summaryText: { fontSize: 16, fontWeight: "600", color: "#94665B" },
  summaryDays: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 8,
  },
});
