import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

const { height, width } = Dimensions.get("window");

export default function SignupScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Don't block UI while fonts load; render immediately

  return (
    <ImageBackground
      source={require("../../assets/images/tailorbackground.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "rgba(10, 10, 20, 0.85)",
          "rgba(5, 8, 20, 0.8)",
          "rgba(0, 0, 0, 0.9)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.overlay}
      >
        <View style={styles.formContainer}>
          <Text style={[styles.title, { fontFamily: "Poppins_600SemiBold" }]}>
            Sign Up
          </Text>

          <TextInput
            style={[styles.input, { fontFamily: "Poppins_400Regular" }]}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={[styles.input, { fontFamily: "Poppins_400Regular" }]}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={[styles.input, { fontFamily: "Poppins_400Regular" }]}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={[styles.input, { fontFamily: "Poppins_400Regular" }]}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <LinearGradient
            colors={["#1E3A8A", "#1E3A8A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <TouchableOpacity onPress={() => router.push("/home")}>
              <Text
                style={[styles.buttonText, { fontFamily: "Poppins_500Medium" }]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={[styles.loginText, { fontFamily: "Poppins_400Regular" }]}>
              Already have an account?{" "}
              <Text style={{ color: "#1E3A8A", fontWeight: "600" }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    width: width * 0.9,
    maxWidth: 400,
    padding: width * 0.06,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: {
    fontSize: width * 0.06,
    color: "#333",
    marginBottom: height * 0.03,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    fontSize: width * 0.04,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: height * 0.018,
  },
  buttonGradient: {
    width: "100%",
    borderRadius: 30,
    paddingVertical: height * 0.018,
    alignItems: "center",
    marginBottom: height * 0.018,
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.04,
  },
  loginText: {
    fontSize: width * 0.035,
    color: "#555",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
