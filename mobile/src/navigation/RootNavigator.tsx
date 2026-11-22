import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { StudyHubScreen } from '../screens/study/StudyHubScreen';
import { MyNotesScreen } from '../screens/study/MyNotesScreen';
import { StudyMaterialsScreen } from '../screens/study/StudyMaterialsScreen';
import { AssignmentsScreen } from '../screens/study/AssignmentsScreen';
import { StudyPlannerScreen } from '../screens/study/StudyPlannerScreen';
import { QuizPracticeScreen } from '../screens/study/QuizPracticeScreen';
import { StudyProgressScreen } from '../screens/study/StudyProgressScreen';
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

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated } = useAuth();

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
          <Stack.Screen name="StudyNotes" component={MyNotesScreen} />
          <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} />
          <Stack.Screen name="StudyAssignments" component={AssignmentsScreen} />
          <Stack.Screen name="StudyPlanner" component={StudyPlannerScreen} />
          <Stack.Screen name="StudyQuiz" component={QuizPracticeScreen} />
          <Stack.Screen name="StudyProgress" component={StudyProgressScreen} />
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
