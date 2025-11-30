import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export async function registerUser(userData) {
  try {
    const response = await axios.post(`${BASE_URL}/register`, userData);

    const data = response.data;

    // Save token if available
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return { success: true, ...data };
  } catch (error) {
    console.error("Register axios error:", error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Server error during registration",
    };
  }
}

export async function loginUser(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/login`, credentials);
    const data = response.data;

    if (
      data.message === "Login successful" ||
      data.message === "Admin login successful"
    ) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      const userData = data.user || data.admin;
      localStorage.setItem("user", JSON.stringify(userData));
    }

    return data;
  } catch (error) {
    console.error("Login axios error:", error);

    return {
      message: error.response?.data?.message || "Server error during login",
    };
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUserRole() {
  return localStorage.getItem("role");
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}

export async function getGoogleAuthUrl() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/google`);
    return response.data.authUrl;
  } catch (error) {
    console.error("Google auth URL error:", error);
    throw error;
  }
}
