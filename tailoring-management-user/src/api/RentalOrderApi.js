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

// Get all rental orders (admin only)
export async function getAllRentalOrders() {
    try {
        const response = await axios.get(`${BASE_URL}/orders/rental/orders`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get rental orders error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching rental orders",
            orders: []
        };
    }
}

// Get rental orders by status (admin only)
export async function getRentalOrdersByStatus(status) {
    try {
        const response = await axios.get(`${BASE_URL}/orders/rental/orders/status/${status}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get rental orders by status error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching rental orders by status",
            orders: []
        };
    }
}

// Update rental order item (admin only)
export async function updateRentalOrderItem(itemId, updateData) {
    try {
        const response = await axios.put(`${BASE_URL}/orders/rental/items/${itemId}`, updateData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Update rental order item error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error updating rental order item"
        };
    }
}
