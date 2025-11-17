import React, { useState } from "react";
import {View,Text,TextInput,TouchableOpacity,ImageBackground,StyleSheet,ActivityIndicator,} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {useFonts,Poppins_400Regular,Poppins_500Medium,Poppins_600SemiBold,} from "@expo-google-fonts/poppins";

export default function LoginScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [name, setName] = useState("");
  const [booking, setBooking] = useState("");

  

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
          <Text style={[styles.title, { fontFamily: "Poppins_600SemiBold" }]}>Login</Text>

          <TextInput
            style={[styles.input, { fontFamily: "Poppins_400Regular" }]}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, { fontFamily: "Poppins_400Regular" }]}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={booking}
            onChangeText={setBooking}
          />

          <LinearGradient
            colors={["#1E3A8A", "#1E3A8A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <TouchableOpacity onPress={() => router.replace("/home") }>
              <Text style={[styles.buttonText, { fontFamily: "Poppins_500Medium" }]}>Login</Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={[styles.signupText, { fontFamily: "Poppins_400Regular" }]}>
              Don’t have an account? <Text style={{ color: "#1E3A8A", fontWeight: "600" }}>Sign up</Text>
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
    width: "90%",
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 24,
    color: "#333",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 15,
  },
  buttonGradient: {
    width: "100%",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  signupText: {
    fontSize: 14,
    color: "#555",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
