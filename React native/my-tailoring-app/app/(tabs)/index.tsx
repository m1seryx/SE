import React from "react";
import {View,Text,ImageBackground,StyleSheet,TouchableOpacity,ActivityIndicator,} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {useFonts,Poppins_300Light,Poppins_400Regular,Poppins_500Medium,Poppins_600SemiBold,} from "@expo-google-fonts/poppins";

export default function LandingScreen() {
  const router = useRouter();

 
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

 
  // Don't block while fonts load; render immediately with system fonts
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
        <View style={styles.textContainer}>
          <Text style={[styles.title, { fontFamily: "Poppins_600SemiBold" }]}>
            D’jackman Tailor Deluxe
          </Text>
          <Text style={[styles.subtitle, { fontFamily: "Poppins_400Regular" }]}>
            youre Perfect fits awaits.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/login")}
        >
          <Text style={[styles.buttonText, { fontFamily: "Poppins_500Medium" }]}>
            Get started
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </ImageBackground>
    
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 250,
  },
  textContainer: {
    marginBottom: 170,
  },
  title: {
    fontSize: 28,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#dcdcdc",
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
