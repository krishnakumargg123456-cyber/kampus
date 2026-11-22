import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, Users, Sparkles, LayoutGrid } from 'lucide-react-native';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { StudyHubScreen } from '../screens/study/StudyHubScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { KampusAiScreen } from '../screens/ai/KampusAiScreen';
import { MoreScreen } from '../screens/more/MoreScreen';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 16);
  const barHeight = Platform.OS === 'ios' ? 56 + bottomInset : 62 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: isDark ? '#070d1e' : '#ffffff',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 16,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color, fontWeight: focused ? '800' : '600' }]}>
                Home
              </Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Study"
        component={StudyHubScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color, fontWeight: focused ? '800' : '600' }]}>
                Study
              </Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <BookOpen size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color, fontWeight: focused ? '800' : '600' }]}>
                Community
              </Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="KampusAi"
        component={KampusAiScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color, fontWeight: focused ? '800' : '600' }]}>
                KAMPUS AI
              </Text>
              {focused && <View style={[styles.activeDot, { backgroundColor: '#a855f7' }]} />}
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && [styles.activeIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]]}>
              <Sparkles size={22} color={focused ? '#a855f7' : color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.tabLabelContainer}>
              <Text style={[styles.tabLabelText, { color, fontWeight: focused ? '800' : '600' }]}>
                More
              </Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabelContainer: {
    alignItems: 'center',
    position: 'relative',
    paddingTop: 2,
  },
  tabLabelText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38bdf8',
    marginTop: 2,
  },
  iconWrapper: {
    width: 34,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
});
