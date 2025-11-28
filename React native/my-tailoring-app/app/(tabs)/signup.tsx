import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground
      source={require("../../assets/images/tailorbackground.jpg")}
      style={styles.background}
      resizeMode="cover"
      blurRadius={2}
    >
      <LinearGradient
        colors={[
          "rgba(15, 23, 42, 0.95)",
          "rgba(30, 41, 59, 0.9)",
          "rgba(51, 65, 85, 0.95)",
        ]}
        style={styles.overlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <View style={styles.container}>
            {/* Sign Up Card */}
            <View style={styles.card}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join the finest tailoring experience
              </Text>

              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.replace("/home")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#991b1b", "#7f1d1d", "#6b1414"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.loginButtonText}>Create Account</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.line} />
              </View>

              {/* Login Link */}
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.signupText}>
                  Already have an account?{" "}
                  <Text style={styles.signupLink}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

// SAME EXACT STYLES AS LOGIN SCREEN
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(251, 191, 36, 0.3)",
    marginBottom: 16,
  },
  appName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: "#fbbf24",
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#cbd5e1",
    marginTop: 4,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 30,
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#64748b",
    marginBottom: 32,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 18,
    height: 58,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#1e293b",
  },

  loginButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  loginButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: "#ffffff",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  orText: {
    marginHorizontal: 16,
    fontFamily: "Poppins_500Medium",
    color: "#94a3b8",
    fontSize: 14,
  },

  signupText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "#64748b",
  },
  signupLink: {
    color: "#f97316",
    fontFamily: "Poppins_600SemiBold",
  },
});
