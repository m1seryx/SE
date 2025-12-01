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

// Get all completed items (excluding rental)
export async function getCompletedItems() {
    try {
        const response = await axios.get(`${BASE_URL}/inventory/items`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get inventory items error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching inventory items",
            items: []
        };
    }
}

// Get items by service type (excluding rental)
export async function getItemsByServiceType(serviceType) {
    try {
        const response = await axios.get(`${BASE_URL}/inventory/items/service/${serviceType}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get inventory items by service type error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching inventory items by service type",
            items: []
        };
    }
}

// Get inventory statistics
export async function getInventoryStats() {
    try {
        const response = await axios.get(`${BASE_URL}/inventory/stats`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get inventory stats error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching inventory statistics",
            stats: {
                total: 0,
                customization: 0,
                dryCleaning: 0,
                repair: 0,
                totalValue: 0
            }
        };
    }
}