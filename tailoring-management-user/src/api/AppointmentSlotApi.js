import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Get available time slots for a date and service type
export async function getAvailableSlots(serviceType, date) {
  try {
    const response = await axios.get(`${BASE_URL}/appointments/available`, {
      params: { serviceType, date }
    });
    return response.data;
  } catch (error) {
    console.error("Get available slots error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching available slots",
      slots: []
    };
  }
}

// Check if a specific slot is available
export async function checkSlotAvailability(serviceType, date, time) {
  try {
    const response = await axios.get(`${BASE_URL}/appointments/check`, {
      params: { serviceType, date, time }
    });
    return response.data;
  } catch (error) {
    console.error("Check slot availability error:", error);
    return {
      success: false,
      available: false,
      message: error.response?.data?.message || "Error checking slot availability"
    };
  }
}

// Book a slot
export async function bookSlot(serviceType, date, time, cartItemId = null) {
  try {
    // Ensure time is in HH:MM:SS format
    let formattedTime = time;
    if (time && !time.includes(':')) {
      formattedTime = time;
    } else if (time && time.split(':').length === 2) {
      formattedTime = time + ':00';
    }

    const response = await axios.post(
      `${BASE_URL}/appointments/book`,
      { serviceType, date, time: formattedTime, cartItemId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Book slot error:", error);
    console.error("Error details:", error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Error booking slot"
    };
  }
}

// Cancel a slot
export async function cancelSlot(slotId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/appointments/cancel/${slotId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Cancel slot error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error cancelling slot"
    };
  }
}

// Get user's booked slots
export async function getUserSlots() {
  try {
    const response = await axios.get(
      `${BASE_URL}/appointments/user-slots`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Get user slots error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching user slots",
      slots: []
    };
  }
}

