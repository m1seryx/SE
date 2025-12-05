// app/(auth)/LoginScreen.tsx
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
  ScrollView,
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <ImageBackground
      source={require("../../assets/images/tailorbackground.jpg")}
      style={styles.background}
      resizeMode="cover"
      blurRadius={1.5}
    >
      {/* 50% black overlay — matches Landing & Signup perfectly */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Login Card */}
            <View style={styles.authCard}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your journey
              </Text>

              {/* Email */}
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Username or Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.replace("/home")}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#8B4513", "#A0522D", "#6B3A0A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.loginText}>Login Now</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don't have an account?{" "}
                  <Text
                    style={styles.link}
                    onPress={() => router.push("/signup")}
                  >
                    Sign Up
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  // 50% black overlay — exactly like Landing & Signup
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 20,
  },
  brandName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#e2e8f0",
    marginTop: 4,
  },

  authCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 40,
    shadowColor: "#8B4513",
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 25,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginBottom: 30,
  },

  inputGroup: {
    marginBottom: 18,
    position: "relative",
  },
  input: {
    width: "100%",
    padding: 18,
    backgroundColor: "#fdfaf7",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e8d5c4",
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 18,
  },

  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  remember: {
    fontSize: 14,
    color: "#666",
  },
  forgot: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "600",
  },

  loginBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
  },
  gradientBtn: {
    paddingVertical: 18,
    alignItems: "center",
  },
  loginText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    color: "#888",
  },
  link: {
    color: "#8B4513",
    fontWeight: "700",
  },
});
