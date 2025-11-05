import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: "none" }, // Hide tab bar for all screens by default
      }}
    >
      {/* Landing */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Welcome",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Auth screens */}
      <Tabs.Screen
        name="login"
        options={{
          title: "Login",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="signup"
        options={{
          title: "Sign Up",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.badge.plus" color={color} />
          ),
        }}
      />

      {/* Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Rental routes - tab bar hidden by default */}
      <Tabs.Screen
        name="rental/index"
        options={{
          title: "Rental",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="shirt" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rental/[id]"
        options={{
          title: "Rental Detail",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="shirt" color={color} />
          ),
        }}
      />

      {/* Appointment routes - tab bar hidden by default */}
      <Tabs.Screen
        name="appointment/AppointmentScreen"
        options={{
          title: "Appointment",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointment/appointmentSelection"
        options={{
          title: "Appointment Selection",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointment/CustomizeClothes"
        options={{
          title: "Customize",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="scissors" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointment/RepairClothes"
        options={{
          title: "Repair",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="hammer" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}