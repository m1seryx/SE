const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const notificationApi = {
  // Get all notifications for the logged-in user
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/api/notifications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch unread count');
    const data = await res.json();
    return data.count || 0;
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    const res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark as read');
    return res.json();
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
    return res.json();
  },
};
