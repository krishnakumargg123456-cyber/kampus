import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { ShieldCheck } from 'lucide-react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

// Handle OAuth browser redirects at the top-level module entry
WebBrowser.maybeCompleteAuthSession();

const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  (Constants.expoConfig?.extra as any)?.clerkPublishableKey ||
  'pk_test_b3JpZW50ZWQtamVubmV0LTU5NDUuY2xlcmsuYWNjb3VudHMuZGV2JA';

function LoadingSplash() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.splashContainer, { backgroundColor: isDark ? colors.background : '#0f172a' }]}>
      <View style={styles.splashBadge}>
        <ShieldCheck size={48} color="#2563eb" />
      </View>
      <Text style={styles.splashTitle}>KAMPUS</Text>
      <Text style={styles.splashSubtitle}>Your Student Life, Connected.</Text>
      <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 28 }} />
    </View>
  );
}

function MainApp() {
  const { isDark, colors } = useTheme();
  const { isLoading } = useAuth();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      {isLoading ? (
        <LoadingSplash />
      ) : (
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <MainApp />
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
