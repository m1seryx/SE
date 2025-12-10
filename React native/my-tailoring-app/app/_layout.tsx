import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

export default function RootLayout() {
  useEffect(() => {
    // Configure system UI to respect safe areas
    SystemUI.setBackgroundColorAsync('#ffffff');
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" translucent={false} />
    </SafeAreaProvider>
  );
}
