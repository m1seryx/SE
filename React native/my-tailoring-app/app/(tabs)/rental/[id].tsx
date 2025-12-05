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
  TouchableWithoutFeedback,
} from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import { rentalService } from "../../../utils/rentalService";
import { cartService } from "../../../utils/apiService";

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
  const [showImageModal, setShowImageModal] = useState(false); // NEW: Full image modal

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
    <>
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/home")}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Clickable Hero Image */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => setShowImageModal(true)}
          style={styles.imageContainer}
        >
          <Image source={getImageSource()} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay}>
            <Ionicons name="expand-outline" size={28} color="#fff" />
            <Text style={styles.tapToZoom}>Tap to zoom</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sheet}>
          <LinearGradient
            colors={["#78350F", "#92400E"]}
            style={styles.titleBadge}
          >
            <Text style={styles.titleText}>{item.item_name}</Text>
          </LinearGradient>

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Rental Price</Text>
            <Text style={styles.priceValue}>₱{item.daily_rate}/day</Text>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {[
              { key: "size", icon: "resize-outline", value: item.size },
              { key: "color", icon: "color-palette-outline", value: item.color },
              { key: "brand", icon: "business-outline", value: item.brand },
              { key: "material", icon: "shirt-outline", value: item.material },
            ].map((detail) => (
              <View key={detail.key} style={styles.detailItem}>
                <Ionicons
                  name={detail.icon as any}
                  size={20}
                  color="#94665B"
                />
                <Text style={styles.detailLabel}>
                  {detail.key.charAt(0).toUpperCase() + detail.key.slice(1)}
                </Text>
                <Text style={styles.detailValue}>{detail.value || "N/A"}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this garment</Text>
            <Text style={styles.description}>
              {item.description || "Premium rental garment. Perfect for formal occasions."}
            </Text>
          </View>

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
                  <Text style={styles.placeholderText}>
                    Tap to select dates
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {startDate && endDate && (
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Cost</Text>
                <Text style={styles.totalValue}>
                  ₱{calculateTotal().toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
            <LinearGradient
              colors={["#78350F", "#92400E"]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Ionicons name="cart" size={24} color="#fff" />
            <Text style={styles.addBtnText}>ADD TO CART</Text>
          </TouchableOpacity>

          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Rental Policy</Text>
            <View style={styles.policyRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.policyText}>
                Minimum 1 day • Maximum 30 days
              </Text>
            </View>
            <View style={styles.policyRow}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.policyText}>Late return: ₱100 per day</Text>
            </View>
            <View style={styles.policyRow}>
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              <Text style={styles.policyText}>Refundable deposit: ₱500</Text>
            </View>
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
                    const diff =
                      tempEndDate.getTime() - tempStartDate.getTime();
                    return Math.ceil(diff / 86400000) + 1;
                  })()}{" "}
                  day
                  {(() => {
                    const diff =
                      tempEndDate.getTime() - tempStartDate.getTime();
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

              {/* Cost Breakdown */}
              <View style={styles.costBreakdown}>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Base Fee</Text>
                  <Text style={styles.costValue}>
                    ₱{parseFloat(item.base_rental_fee || "0").toLocaleString()}
                  </Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>
                    Daily Rate × {getRentalDays()} days
                  </Text>
                  <Text style={styles.costValue}>
                    ₱
                    {(
                      parseFloat(item.daily_rate || "0") * getRentalDays()
                    ).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.costDivider} />
              </View>

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

        {/* Full-Screen Image Modal */}
        <Modal visible={showImageModal} transparent={true} animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowImageModal(false)}>
            <View style={styles.fullImageOverlay}>
              <View style={styles.fullImageHeader}>
                <TouchableOpacity
                  style={styles.closeImageBtn}
                  onPress={() => setShowImageModal(false)}
                >
                  <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
              <Image
                source={getImageSource()}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  titleBadge: {
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#78350F",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  titleText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 16,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 380,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 0,
  },
  tapToZoom: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sheet: {
    marginTop: -30,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  priceSection: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#FDF4F0",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#F5ECE3",
  },
  priceLabel: {
    fontSize: 15,
    color: "#78716C",
    marginBottom: 6,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#FDE68A",
    alignSelf: "flex-start",
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#94665B",
    letterSpacing: 0.5,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 28,
    gap: 12,
  },
  detailItem: {
    width: "48%",
    backgroundColor: "#FAFAFA",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 12.5,
    color: "#78716C",
    marginTop: 10,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 6,
  },
  section: { marginTop: 36 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  description: { fontSize: 15.5, color: "#52525B", lineHeight: 24 },
  calendarBtn: {
    backgroundColor: "#FAFAFA",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  dateText: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  daysText: { fontSize: 14, color: "#94665B", marginTop: 6, fontWeight: "600" },
  placeholderText: { fontSize: 15.5, color: "#9CA3AF", fontWeight: "500" },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FDF4F0",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F5ECE3",
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#94665B",
  },
  addBtn: {
    marginTop: 36,
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    gap: 12,
    shadowColor: "#78350F",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 36,
    width: "92%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FDF4F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 28,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  costBreakdown: {
    width: "100%",
    marginVertical: 20,
    paddingVertical: 16,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  costValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  costDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  modalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#FAFAFA",
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalTotalLabel: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalTotalValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#94665B",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#94665B",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
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
  calendarTitle: { fontSize: 19, fontWeight: "800", color: "#1F2937" },
  doneText: { fontSize: 17, fontWeight: "700", color: "#94665B" },
  selectionSummary: {
    padding: 24,
    backgroundColor: "#FDF4F0",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F5ECE3",
  },
  summaryText: { fontSize: 17, fontWeight: "700", color: "#94665B" },
  summaryDays: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    marginTop: 10,
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 30,
    left: 20,
    zIndex: 10,
  },
  closeImageBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 30,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  policyText: { fontSize: 15, color: "#52525B", flex: 1 },
  policyCard: {
    marginTop: 36,
    backgroundColor: "#FAFAFA",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
});