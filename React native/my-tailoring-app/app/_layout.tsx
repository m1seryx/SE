import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

// Declare ErrorUtils for TypeScript
declare const ErrorUtils: {
  getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | null;
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

export default function RootLayout() {
  useEffect(() => {
    // Configure system UI to respect safe areas
    SystemUI.setBackgroundColorAsync('#ffffff');
    
    // Suppress update-related errors to prevent app crashes
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      // Silently ignore update-related errors as they're not critical
      if (error?.message?.includes('Failed to download remote update') ||
          error?.message?.includes('java.io.IOException') ||
          error?.message?.includes('remote update')) {
        console.warn('Update check failed (ignored):', error.message);
        return; // Don't crash on update errors
      }
      // Call original handler for other errors
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });

    // Also catch unhandled promise rejections related to updates
    const originalUnhandledRejection = global.onunhandledrejection;
    global.onunhandledrejection = (event: any) => {
      const error = event?.reason || event;
      if (error?.message?.includes('Failed to download remote update') ||
          error?.message?.includes('java.io.IOException') ||
          error?.message?.includes('remote update')) {
        console.warn('Update check promise rejection (ignored):', error?.message);
        event?.preventDefault?.(); // Prevent default error handling
        return;
      }
      // Call original handler for other errors
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
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
