import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, Users, Sparkles, LayoutGrid } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { StudyHubScreen } from '../screens/study/StudyHubScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { KampusAiScreen } from '../screens/ai/KampusAiScreen';
import { MoreScreen } from '../screens/more/MoreScreen';
import { useTheme } from '../theme/ThemeContext';
import { Platform, View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : '#ffffff',
          borderTopColor: isDark ? colors.border : '#e2e8f0',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color }]}>Home</Text>
              {focused && <View style={styles.activeUnderline} />}
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Study"
        component={StudyHubScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color }]}>Study</Text>
              {focused && <View style={styles.activeUnderline} />}
            </View>
          ),
          tabBarIcon: ({ color, size }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color }]}>Community</Text>
              {focused && <View style={styles.activeUnderline} />}
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Users size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="KampusAi"
        component={KampusAiScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color }]}>KAMPUS AI</Text>
              {focused && <View style={styles.activeUnderline} />}
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Sparkles size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color }]}>More</Text>
              {focused && <View style={styles.activeUnderline} />}
            </View>
          ),
          tabBarIcon: ({ color, size }) => <LayoutGrid size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabelContainer: {
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 2,
  },
  tabLabelText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  activeUnderline: {
    width: 18,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#2563eb',
    marginTop: 2,
  },
});

