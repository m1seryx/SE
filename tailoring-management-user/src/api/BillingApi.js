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

// Get all billing records (admin only)
export async function getAllBillingRecords() {
    try {
        const response = await axios.get(`${BASE_URL}/billing/records`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get billing records error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching billing records",
            records: []
        };
    }
}

// Get billing records by status (admin only)
export async function getBillingRecordsByStatus(status) {
    try {
        const response = await axios.get(`${BASE_URL}/billing/records/status/${status}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get billing records by status error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching billing records by status",
            records: []
        };
    }
}

// Update billing record status (admin only)
export async function updateBillingRecordStatus(recordId, status) {
    try {
        const response = await axios.put(`${BASE_URL}/billing/records/${recordId}/status`, 
            { status },
            {
                headers: getAuthHeaders()
            }
        );
        return response.data;
    } catch (error) {
        console.error("Update billing record status error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error updating billing record status"
        };
    }
}

// Get billing statistics (admin only)
export async function getBillingStats() {
    try {
        const response = await axios.get(`${BASE_URL}/billing/stats`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Get billing stats error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error fetching billing statistics",
            stats: {
                total: 0,
                paid: 0,
                unpaid: 0,
                totalRevenue: 0,
                pendingRevenue: 0
            }
        };
    }
}