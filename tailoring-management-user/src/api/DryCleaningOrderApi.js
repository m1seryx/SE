const API_URL = 'http://localhost:5000/api/orders';

// Helper to get auth header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Get all dry cleaning orders
export const getAllDryCleaningOrders = async () => {
    try {
        const response = await fetch(`${API_URL}/dry-cleaning/orders`, {
            headers: getAuthHeader()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching dry cleaning orders:', error);
        return { success: false, message: 'Network error' };
    }
};

// Get dry cleaning orders by status
export const getDryCleaningOrdersByStatus = async (status) => {
    try {
        const response = await fetch(`${API_URL}/dry-cleaning/orders/status/${status}`, {
            headers: getAuthHeader()
        });
        return await response.json();
    } catch (error) {
        console.error(`Error fetching dry cleaning orders with status ${status}:`, error);
        return { success: false, message: 'Network error' };
    }
};

// Update dry cleaning order item (price, status, notes)
export const updateDryCleaningOrderItem = async (itemId, updateData) => {
    try {
        const response = await fetch(`${API_URL}/dry-cleaning/items/${itemId}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(updateData)
        });
        return await response.json();
    } catch (error) {
        console.error(`Error updating dry cleaning order item ${itemId}:`, error);
        return { success: false, message: 'Network error' };
    }
};
