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

// Get all order tracking for the user
export async function getUserOrderTracking() {
  try {
    const response = await axios.get(`${BASE_URL}/tracking`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get order tracking error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching order tracking",
      data: []
    };
  }
}

// Get tracking history for a specific order item
export async function getOrderItemTrackingHistory(orderItemId) {
  try {
    const response = await axios.get(`${BASE_URL}/tracking/history/${orderItemId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get tracking history error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching tracking history",
      data: null
    };
  }
}

// Update tracking status (admin only)
export async function updateTrackingStatus(orderItemId, status, notes) {
  try {
    const response = await axios.post(`${BASE_URL}/tracking/update/${orderItemId}`, 
      { status, notes }, 
      {
        headers: getAuthHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error("Update tracking status error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error updating tracking status"
    };
  }
}

// Get available status transitions for an order item (admin only)
export async function getStatusTransitions(orderItemId) {
  try {
    const response = await axios.get(`${BASE_URL}/tracking/transitions/${orderItemId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Get status transitions error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error fetching status transitions",
      data: null
    };
  }
}

// Helper function to get status badge class
export function getStatusBadgeClass(status) {
  const statusMap = {
    'pending': 'pending',
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
}

// Helper function to get status label
export function getStatusLabel(status) {
  const statusMap = {
    'pending': 'Pending',
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
}

// Helper function to get service type specific status flow
export function getServiceStatusFlow(serviceType) {
  const flows = {
    'repair': ['pending', 'in_progress', 'ready_to_pickup'],
    'customize': ['pending', 'in_progress', 'ready_to_pickup'],
    'dry_cleaning': ['pending', 'in_progress', 'ready_to_pickup'],
    'rental': ['pending', 'picked_up', 'rented', 'returned']
  };
  return flows[serviceType] || flows['repair'];
}
