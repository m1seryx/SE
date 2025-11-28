import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

export default function LandingScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_300Light,
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
      blurRadius={3}
    >
      <LinearGradient
        colors={[
          "rgba(15, 23, 42, 0.97)",
          "rgba(30, 41, 59, 0.92)",
          "rgba(51, 65, 85, 0.98)",
        ]}
        style={styles.overlay}
      >
        {/* Main Content */}
        <View style={styles.container}>
          {/* Logo + Brand */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="cut-outline" size={48} color="#fbbf24" />
            </View>
            <Text style={styles.brandName}>D’Jackmans</Text>
            <Text style={styles.brandSubtitle}>Tailor Deluxe</Text>
          </View>

          {/* Hero Text */}
          <View style={styles.hero}>
            <Text style={styles.title}>Exquisite Craftsmanship</Text>
            <Text style={styles.subtitle}>
              Your perfect fit awaits — tailored with precision, worn with
              pride.
            </Text>
          </View>

          {/* Luxury Maroon Button */}
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => router.replace("/login")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#991b1b", "#7f1d1d", "#6b1414"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Get Started!</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Subtle tagline */}
          <Text style={styles.footerText}>Precision tailoring since 1987</Text>
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
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.08,
  },

  // Logo Section
  header: {
    alignItems: "center",
    marginBottom: height * 0.06,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(251, 191, 36, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(251, 191, 36, 0.35)",
    marginBottom: 20,
    shadowColor: "#fbbf24",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  brandName: {
    fontFamily: "Poppins_700Bold",
    fontSize: width * 0.095,
    color: "#fbbf24",
    letterSpacing: 2,
    textShadowColor: "rgba(251, 191, 36, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  brandSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: width * 0.05,
    color: "#e2e8f0",
    letterSpacing: 4,
    marginTop: 4,
  },

  // Hero Text
  hero: {
    alignItems: "center",
    marginBottom: height * 0.08,
    paddingHorizontal: width * 0.06,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: width * 0.09,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: width * 0.11,
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: width * 0.045,
    color: "#cbd5e1",
    textAlign: "center",
    lineHeight: width * 0.065,
    paddingHorizontal: width * 0.05,
  },

  // Maroon Luxury Button
  buttonContainer: {
    width: "85%",
    maxWidth: 360,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: height * 0.06,
    shadowColor: "#991b1b",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 18,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "rgba(153, 27, 27, 0.4)",
  },
  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#ffffff",
    letterSpacing: 1,
    padding: 10,
  },

  // Footer
  footerText: {
    fontFamily: "Poppins_300Light",
    fontSize: 13,
    color: "#94a3b8",
    letterSpacing: 2,
    marginTop: 10,
  },
});
