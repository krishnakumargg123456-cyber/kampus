import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShieldCheck } from 'lucide-react-native';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { StudyHubScreen } from '../screens/study/StudyHubScreen';
import { KampusAiScreen } from '../screens/ai/KampusAiScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { CampusLifeScreen } from '../screens/campus/CampusLifeScreen';
import { CareerScreen } from '../screens/career/CareerScreen';
import { CollegeExplorerScreen } from '../screens/college/CollegeExplorerScreen';
import { MarketScreen } from '../screens/market/MarketScreen';
import { StudentToolkitScreen } from '../screens/toolkit/StudentToolkitScreen';
import { KampusIdScreen } from '../screens/id/KampusIdScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
          <ShieldCheck size={36} color={colors.primary} />
        </View>
        <Text style={[styles.loadingTitle, { color: colors.text }]}>KAMPUS</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!isAuthenticated ? (
        // Unauthenticated Stack
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : (
        // Authenticated Student App Stack
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="StudyHub" component={StudyHubScreen} />
          <Stack.Screen name="KampusAi" component={KampusAiScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="CampusLife" component={CampusLifeScreen} />
          <Stack.Screen name="Career" component={CareerScreen} />
          <Stack.Screen name="CollegeExplorer" component={CollegeExplorerScreen} />
          <Stack.Screen name="Market" component={MarketScreen} />
          <Stack.Screen name="StudentToolkit" component={StudentToolkitScreen} />
          <Stack.Screen name="KampusId" component={KampusIdScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
