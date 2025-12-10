// Customizer3D.tsx - WebView integration for 3D customization tool
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
  BackHandler,
  StatusBar,
  TouchableOpacity,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { 
  uploadCustomizationImage, 
  addCustomizationToCart,
  convertBase64ToFormData 
} from '../../../utils/customizationService';

// Configure your web 3D customizer URL - Use your computer's local IP
// Make sure the web app is running: cd tailoring-management-user && npm run dev
const WEB_3D_CUSTOMIZER_URL = process.env.EXPO_PUBLIC_WEB_3D_URL || 'http://192.168.254.102:5174/3d-customizer';

// Log the URL for debugging
console.log('3D Customizer URL:', WEB_3D_CUSTOMIZER_URL);

interface CustomizationData {
  type: 'CUSTOMIZATION_COMPLETE' | 'CUSTOMIZATION_CANCEL' | 'CUSTOMIZATION_ERROR' | 'DESIGN_IMAGE_READY' | 'CONSOLE_LOG';
  garmentType?: string;
  fabricType?: string;
  designImage?: string; // base64 image
  imageData?: string; // base64 image from save
  garmentName?: string;
  designData?: any;
  measurements?: any;
  notes?: string;
  estimatedPrice?: number;
  error?: string;
  message?: string;
}

export default function Customizer3DScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  // Loading timeout - show error after 15 seconds
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading && !loadError) {
      interval = setInterval(() => {
        setLoadingTime(prev => {
          if (prev >= 15) {
            setLoadError(`Connection timeout. Make sure the web app is running at:\n${WEB_3D_CUSTOMIZER_URL}`);
            setIsLoading(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadError]);

  // Get auth data on mount
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const user = await AsyncStorage.getItem('userData');
        setAuthToken(token);
        if (user) {
          const userData = JSON.parse(user);
          setUserId(userData.id || userData.userId);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      }
    };
    loadAuthData();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  // JavaScript to inject into web page for communication
  const injectedJavaScript = `
    (function() {
      // Store auth data in web app
      window.REACT_NATIVE_AUTH = {
        token: ${authToken ? `"${authToken}"` : 'null'},
        userId: ${userId ? `"${userId}"` : 'null'},
        platform: 'react-native',
        version: '1.0.0'
      };

      // Override console.log to forward logs to RN (for debugging)
      const originalLog = console.log;
      console.log = function(...args) {
        originalLog.apply(console, args);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CONSOLE_LOG',
            message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
          }));
        }
      };

      // Helper function for web app to send data to React Native
      window.sendToReactNative = function(data) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
          return true;
        }
        return false;
      };

      // Notify web app that we're in React Native WebView
      window.IS_REACT_NATIVE_WEBVIEW = true;
      
      // Dispatch custom event to notify web app
      document.dispatchEvent(new CustomEvent('reactNativeReady', { 
        detail: window.REACT_NATIVE_AUTH 
      }));

      // Also try to call init function if it exists
      if (typeof window.initReactNativeMode === 'function') {
        window.initReactNativeMode(window.REACT_NATIVE_AUTH);
      }

      true; // Required for Android
    })();
  `;

  // Handle messages from WebView
  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const data: CustomizationData = JSON.parse(event.nativeEvent.data);
      
      console.log('Received message from WebView:', data.type);

      switch (data.type) {
        case 'CUSTOMIZATION_COMPLETE':
          await handleCustomizationComplete(data);
          break;
          
        case 'CUSTOMIZATION_CANCEL':
          handleCustomizationCancel();
          break;
          
        case 'CUSTOMIZATION_ERROR':
          Alert.alert('Error', data.error || 'An error occurred in the customizer');
          break;
          
        case 'DESIGN_IMAGE_READY':
          await handleSaveDesignImage(data);
          break;
          
        case 'CONSOLE_LOG':
          // Debug logs from web app
          console.log('[WebView]:', data.message);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, []);

  // Handle saving design image to device
  const handleSaveDesignImage = async (data: CustomizationData) => {
    if (!data.imageData) {
      Alert.alert('Error', 'No image data received');
      return;
    }

    setIsSaving(true);

    try {
      // Remove data:image/png;base64, prefix if present
      const base64Data = data.imageData.replace(/^data:image\/\w+;base64,/, '');
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const garmentName = data.garmentName || 'custom-design';
      const filename = `${garmentName}-${timestamp}.png`;
      const fileUri = (FileSystem.cacheDirectory || '') + filename;

      // Write base64 to file using string encoding type
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        // Share the image - user can save to gallery from share menu
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Save or Share your design',
          UTI: 'public.png',
        });
        
        Alert.alert(
          '✅ Design Ready!',
          'Use the share menu to save to your gallery or share with others.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device.',
          [{ text: 'OK' }]
        );
      }

      // Clean up temp file after a delay
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 5000);

    } catch (error: any) {
      console.error('Error saving design image:', error);
      Alert.alert(
        'Save Failed',
        error.message || 'Failed to save the design image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle completed customization
  const handleCustomizationComplete = async (data: CustomizationData) => {
    setIsSaving(true);
    
    try {
      let imageUrl = 'no-image';
      
      // Upload design image if provided
      if (data.designImage) {
        try {
          const formData = convertBase64ToFormData(data.designImage, 'custom-design.png');
          const uploadResponse = await uploadCustomizationImage(formData);
          imageUrl = uploadResponse.imageUrl || uploadResponse.data?.imageUrl || imageUrl;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without image
        }
      }
      
      // Add to cart
      const cartResponse = await addCustomizationToCart({
        garmentType: data.garmentType || 'Polo',
        fabricType: data.fabricType || 'Cotton',
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
        notes: data.notes || '',
        imageUrl: imageUrl,
        designData: data.designData || {},
        estimatedPrice: data.estimatedPrice || 500,
      });
      
      Alert.alert(
        'Success!',
        'Your custom design has been added to cart.',
        [
          {
            text: 'View Cart',
            onPress: () => router.push('/(tabs)/cart/Cart'),
          },
          {
            text: 'Continue Shopping',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving customization:', error);
      Alert.alert(
        'Save Failed',
        error.message || 'Failed to save your customization. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCustomizationCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to leave? Your customization will not be saved.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  // Handle WebView load end
  const handleLoadEnd = () => {
    setIsLoading(false);
    setLoadError(null);
  };

  // Handle WebView error
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setLoadError(nativeEvent.description || 'Failed to load 3D customizer');
    setIsLoading(false);
  };

  // Handle HTTP error
  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('HTTP error:', nativeEvent);
    if (nativeEvent.statusCode >= 400) {
      setLoadError(`Server error: ${nativeEvent.statusCode}`);
    }
  };

  // Retry loading
  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    setLoadingTime(0);
    webViewRef.current?.reload();
  };

  // Open in external browser
  const handleOpenInBrowser = async () => {
    try {
      await Linking.openURL(WEB_3D_CUSTOMIZER_URL);
    } catch (error) {
      Alert.alert('Error', 'Could not open browser');
    }
  };

  // Go back
  const handleGoBack = () => {
    router.back();
  };

  // Render error state
  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#5D4037" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>3D Customizer</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color="#5D4037" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <Text style={styles.urlText}>URL: {WEB_3D_CUSTOMIZER_URL}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.browserButton} onPress={handleOpenInBrowser}>
            <Ionicons name="open-outline" size={18} color="#5D4037" />
            <Text style={styles.browserButtonText}>Open in Browser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5D4037" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>3D Customizer</Text>
        <TouchableOpacity 
          onPress={() => webViewRef.current?.reload()} 
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={22} color="#5D4037" />
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_3D_CUSTOMIZER_URL }}
        style={styles.webview}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        allowFileAccess={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        cacheEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        userAgent={Platform.select({
          ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1 ReactNativeWebView',
          android: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 ReactNativeWebView',
        })}
      />

      {/* Loading Overlay */}
      {(isLoading || isSaving) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5D4037" />
            <Text style={styles.loadingText}>
              {isSaving ? 'Saving your design...' : 'Loading 3D Customizer...'}
            </Text>
            {!isSaving && (
              <>
                <Text style={styles.loadingSubtext}>
                  {loadingTime > 0 ? `${loadingTime}s - This may take a moment` : 'Connecting...'}
                </Text>
                <Text style={styles.loadingUrl} numberOfLines={2}>
                  {WEB_3D_CUSTOMIZER_URL}
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D4037',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'sans-serif-medium',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  placeholder: {
    width: 40,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 240, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5D4037',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#8D6E63',
  },
  loadingUrl: {
    marginTop: 8,
    fontSize: 11,
    color: '#AAA',
    textAlign: 'center',
    maxWidth: 250,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#5D4037',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#8D6E63',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  urlText: {
    fontSize: 11,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  retryButton: {
    backgroundColor: '#5D4037',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#B8860B',
    minWidth: 160,
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  browserButtonText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#5D4037',
    minWidth: 160,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: '500',
  },
});
