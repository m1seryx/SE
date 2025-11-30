// app/(tabs)/rental/[id].tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { cartStore } from "../../utils/cartStore";

// Rental items data - matches home.tsx
const rentalItems = [
  {
    id: "1",
    title: "Men Suit All in Gray",
    price: 500,
    size: "Medium",
    fabric: "Wool blend",
    color: "Gray",
    length: "Regular",
    category: "Men's Formal",
    image: require("../../../assets/images/graysuit.jpg"),
    description:
      "Professional gray suit perfect for business meetings and formal events. Made from premium wool blend fabric.",
  },
  {
    id: "2",
    title: "Classic Black Tuxedo",
    price: 750,
    size: "Large",
    fabric: "Premium cotton",
    color: "Black",
    length: "Regular",
    category: "Men's Formal",
    image: require("../../../assets/images/blacktuxedo.jpg"),
    description:
      "Elegant black tuxedo for weddings and special occasions. Includes jacket, pants, and bow tie.",
  },
  {
    id: "3",
    title: "Royal Blue Coat Set",
    price: 650,
    size: "Medium",
    fabric: "Polyester blend",
    color: "Royal Blue",
    length: "Regular",
    category: "Men's Formal",
    image: require("../../../assets/images/royalblue.jpg"),
    description:
      "Stylish royal blue coat set for formal gatherings. Premium polyester blend for comfort and durability.",
  },
  {
    id: "4",
    title: "Elegant Evening Gown",
    price: 900,
    size: "Small",
    fabric: "Silk",
    color: "Burgundy",
    length: "Floor length",
    category: "Women's Formal",
    image: require("../../../assets/images/gown.jpg"),
    description:
      "Stunning burgundy evening gown in luxurious silk. Perfect for galas and formal events.",
  },
  {
    id: "5",
    title: "Barong Tagalog Premium",
    price: 400,
    size: "Medium",
    fabric: "Jusi",
    color: "Cream White",
    length: "Regular",
    category: "Traditional",
    image: require("../../../assets/images/barong.jpg"),
    description:
      "Premium Barong Tagalog in traditional Jusi fabric. Perfect for Filipino formal occasions.",
  },
  {
    id: "6",
    title: "Formal Black Dress",
    price: 700,
    size: "Medium",
    fabric: "Crepe",
    color: "Black",
    length: "Knee length",
    category: "Women's Formal",
    image: require("../../../assets/images/blackdress.jpg"),
    description:
      "Classic black formal dress in elegant crepe fabric. Versatile for various formal occasions.",
  },
];

export default function RentalDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = rentalItems.find((i) => i.id === id);

  const today = new Date();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text>Item not found</Text>
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

  const calculateTotal = () => item.price * getRentalDays();

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

  const confirmAddToCart = () => {
    const days = getRentalDays();
    const totalPrice = calculateTotal();

    const cartItem = {
      id: Date.now().toString(),
      service: "Rental",
      item: item.title,
      description: `${days} day${days > 1 ? "s" : ""} rental`,
      price: totalPrice,
      icon: "business-outline",
      quantity: days,
      garmentType: item.category,
      specialInstructions: `Rental: ${formatDate(startDate)} → ${formatDate(
        endDate
      )}`,
      appointmentDate: `${formatDate(startDate)} – ${formatDate(endDate)}`,
    };

    cartStore.addItem(cartItem);
    setShowConfirmModal(false);

    Alert.alert("Success!", "Rental added to cart!", [
      { text: "View Cart", onPress: () => router.push("/(tabs)/cart/Cart") },
      { text: "Continue", onPress: () => router.push("/rental") },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/rental")}
      >
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <Image source={item.image} style={styles.image} resizeMode="cover" />

      <View style={styles.sheet}>
        <View style={styles.titlePill}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {item.title}
          </Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Rental Price</Text>
          <Text style={styles.priceValue}>₱{item.price}/day</Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {["size", "fabric", "color", "length"].map((key) => (
            <View key={key} style={styles.detailItem}>
              <Ionicons
                name={
                  key === "size"
                    ? "resize-outline"
                    : key === "fabric"
                    ? "shirt-outline"
                    : key === "color"
                    ? "color-palette-outline"
                    : "swap-vertical-outline"
                }
                size={20}
                color="#94665B"
              />
              <Text style={styles.detailLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Text style={styles.detailValue}>{(item as any)[key]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.desc}>{item.description}</Text>
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
                <Text style={styles.placeholderText}>Tap to select dates</Text>
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

        <TouchableOpacity style={styles.rentBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.rentBtnText}>ADD TO CART</Text>
        </TouchableOpacity>

        <View style={styles.additionalInfo}>
          <Text style={styles.infoTitle}>Rental Info</Text>
          <Text style={styles.infoText}>• Min: 1 day | Max: 30 days</Text>
          <Text style={styles.infoText}>• Late fee: ₱100/day</Text>
          <Text style={styles.infoText}>• Deposit: ₱500 (refundable)</Text>
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
                name="calendar-check-outline"
                size={48}
                color="#94665B"
              />
            </View>
            <Text style={styles.modalTitle}>Confirm Rental</Text>
            <Text style={styles.modalValue}>{item.title}</Text>
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
