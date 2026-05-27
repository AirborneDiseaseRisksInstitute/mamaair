import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IntroStep01 } from '../screens/intro/steps/IntroStep01';
import { IntroStep02 } from '../screens/intro/steps/IntroStep02';
import { IntroStep03 } from '../screens/intro/steps/IntroStep03';
import { IntroStep04 } from '../screens/intro/steps/IntroStep04';
import { IntroStep05 } from '../screens/intro/steps/IntroStep05';
import { IntroStep05Timezone } from '../screens/intro/steps/IntroStep05Timezone';
import { IntroStep06 } from '../screens/intro/steps/IntroStep06';
import { IntroStep07 } from '../screens/intro/steps/IntroStep07';
import { IntroStep08 } from '../screens/intro/steps/IntroStep08';
import { IntroStep09 } from '../screens/intro/steps/IntroStep09';
import { IntroStep10 } from '../screens/intro/steps/IntroStep10';
import { IntroStep10Pregnancy } from '../screens/intro/steps/IntroStep10Pregnancy';
import { IntroStep11 } from '../screens/intro/steps/IntroStep11';
import { IntroStep12 } from '../screens/intro/steps/IntroStep12';
import { IntroStep12NotificationTime } from '../screens/intro/steps/IntroStep12NotificationTime';
import { IntroStep13 } from '../screens/intro/steps/IntroStep13';
import { IntroStep14 } from '../screens/intro/steps/IntroStep14';
import { IntroLoading } from '../screens/intro/steps/IntroLoading';
import { StartFirstDay } from '../screens/intro/steps/StartFirstDay';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { BabyTwinScreen } from '../screens/BabyTwinScreen';
import { MotherTwinScreen } from '../screens/MotherTwinScreen';
import { ReferAppScreen } from '../screens/ReferAppScreen';
import { AdsScreen } from '../screens/AdsScreen';
import { BabyStatusScreen } from '../screens/BabyStatusScreen';
import { AppSettingsScreen } from '../screens/AppSettingsScreen';
import { NotificationTimeScreen } from '../screens/NotificationTimeScreen';
import { PrivacySettingsScreen } from '../screens/PrivacySettingsScreen';
import { PlanBirthdayScreen } from '../screens/PlanBirthdayScreen';
import { RemindersScreen } from '../screens/RemindersScreen';

import { AuthLoadingScreen } from '../screens/AuthLoadingScreen';
import DebugLogsScreen from '../screens/DebugLogsScreen';
import { DEV_MODE } from '../config/dev';
import { useUserStore } from '../store/useUserStore';

export type RootStackParamList = {
  AuthLoading: undefined;
  IntroStep01: undefined;
  IntroStep02: undefined;
  IntroStep03: undefined;
  IntroStep04: undefined;
  IntroStep05: undefined;
  IntroStep05Timezone: undefined;
  IntroStep06: undefined;
  IntroStep07: undefined;
  IntroStep08: undefined;
  IntroStep09: undefined;
  IntroStep10: undefined;
  IntroStep10Pregnancy: undefined;
  IntroStep11: undefined;
  IntroStep12: undefined;
  IntroStep12NotificationTime: undefined;
  IntroStep13: undefined;
  IntroStep14: undefined;
  IntroLoading: undefined;
  StartFirstDay: undefined;
  Home: undefined;
  Today: undefined;
  UserProfile: undefined;
  BabyTwin: undefined;
  MotherTwin: undefined;
  ReferApp: undefined;
  AppSettings: undefined;
  NotificationTime: undefined;
  Reminders: undefined;
  PrivacySettings: undefined;
  PlanBirthday: undefined;
  Ads: undefined;
  BabyStatus: undefined;
  DebugLogs: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Smart navigation helper to find the first incomplete step
const getNextIntroStep = (currentStepIndex: number): keyof RootStackParamList => {
  const { profile } = useUserStore.getState();
  
  // Step definitions and their completion criteria
  // Step 1 is Welcome (always starts here if not skipped entirely)
  // Step 2: Name/Email
  if (currentStepIndex < 2) {
    if (!profile.name || !profile.email) return 'IntroStep02';
  }
  
  // Step 3: Birthday + Height/Weight (all on IntroStep03)
  if (currentStepIndex < 3) {
    if (!profile.birthday || !profile.height || !profile.weight) return 'IntroStep03';
  }

  // Step 4: Language
  if (currentStepIndex < 4) {
    if (!profile.language) return 'IntroStep04';
  }
  
  // Step 5: Country/Language
  if (currentStepIndex < 5) {
    if (!profile.country || !profile.language) return 'IntroStep05';
  }

  // Step 5.5: Timezone
  if (currentStepIndex < 6) {
    if (!profile.timezone) return 'IntroStep05Timezone';
  }
  
  // Step 6: TimeSpent/TimeOfDay (Lifestyle starts here)
  if (currentStepIndex < 7) {
      if (!profile.timeSpent || !profile.timeOfDay) return 'IntroStep06';
  }

  // Step 7: CookingMethod/Ventilation
  if (currentStepIndex < 8) {
      if (!profile.cookingMethod || !profile.ventilation) return 'IntroStep07';
  }

  // Step 8: SleepHours/ActiveHours
  if (currentStepIndex < 9) {
      if (!profile.sleepHours || !profile.activeHours) return 'IntroStep08';
  }

  // Step 9: WorkType
  if (currentStepIndex < 10) {
      if (!profile.workType) return 'IntroStep09';
  }

  // Step 10: Diet
  if (currentStepIndex < 11) {
      if (!profile.diet) return 'IntroStep10';
  }

  // Step 10.5: Pregnancy number (first, second, third, more than 3)
  if (currentStepIndex < 12) {
      if (!profile.pregnancyNumber) return 'IntroStep10Pregnancy';
  }

  // Step 11: Pregnancy Week
  if (currentStepIndex < 13) {
      if (!profile.pregnancyWeek) return 'IntroStep11';
  }

  // Step 12: Notifications
  if (currentStepIndex < 14) {
      return 'IntroStep12';
  }

  // Step 13: Review/Privacy
  // Step 14: Final Consent
  if (currentStepIndex < 15) return 'IntroStep13';
  if (currentStepIndex < 16) return 'IntroStep14';

  return 'IntroStep14'; // Fallback
};

export const Navigation: React.FC = () => {
  const hasVisitedStep2 = useRef(false);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={DEV_MODE ? 'IntroStep01' : 'AuthLoading'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="AuthLoading">
          {({ navigation }) => (
            <AuthLoadingScreen
              onComplete={(target) => {
                if (target === 'Home') {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                } else if (target === 'Intro') {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'IntroStep01' }],
                      });
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'SignIn' }],
                      });
                }
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep01">
          {({ navigation }) => (
            <IntroStep01
              onNext={() => {
                hasVisitedStep2.current = true;
                const nextStep = getNextIntroStep(1);
                // @ts-ignore
                navigation.navigate(nextStep);
              }}
              skipAnimation={hasVisitedStep2.current}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep02">
          {({ navigation }) => (
            <IntroStep02
              onNext={() => {
                  const nextStep = getNextIntroStep(2);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep03">
          {({ navigation }) => (
            <IntroStep03
              onNext={() => {
                  const nextStep = getNextIntroStep(3);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep04">
          {({ navigation }) => (
            <IntroStep04
              onNext={() => {
                  const nextStep = getNextIntroStep(4);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep05">
          {({ navigation }) => (
            <IntroStep05
              onNext={() => {
                  const nextStep = getNextIntroStep(5);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep05Timezone">
          {({ navigation }) => (
            <IntroStep05Timezone
              onNext={() => {
                  const nextStep = getNextIntroStep(6);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep06">
          {({ navigation }) => (
            <IntroStep06
              onNext={() => {
                  const nextStep = getNextIntroStep(7);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep07">
          {({ navigation }) => (
            <IntroStep07
              onNext={() => {
                  const nextStep = getNextIntroStep(8);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep08">
          {({ navigation }) => (
            <IntroStep08
              onNext={() => {
                  const nextStep = getNextIntroStep(9);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep09">
          {({ navigation }) => (
            <IntroStep09
              onNext={() => {
                  const nextStep = getNextIntroStep(10);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep10">
          {({ navigation }) => (
            <IntroStep10
              onNext={() => {
                  const nextStep = getNextIntroStep(11);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep10Pregnancy">
          {({ navigation }) => (
            <IntroStep10Pregnancy
              onNext={() => {
                  const nextStep = getNextIntroStep(12);
                  // @ts-ignore
                  navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep11">
          {({ navigation }) => (
            <IntroStep11
              onNext={() => navigation.navigate('IntroStep12')}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep12">
          {({ navigation }) => (
            <IntroStep12
              onEnableNotifications={() => navigation.navigate('IntroStep12NotificationTime')}
              onSkip={() => navigation.navigate('StartFirstDay')}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep12NotificationTime">
          {({ navigation }) => (
            <IntroStep12NotificationTime
              onNext={() => navigation.navigate('IntroStep13')}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep13">
          {({ navigation }) => (
            <IntroStep13
              onNext={() => navigation.navigate('IntroStep14')}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep14">
          {({ navigation }) => (
            <IntroStep14
              onNext={() => navigation.navigate('IntroLoading')}
              onBack={() => navigation.goBack()}
              onSkip={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroLoading">
          {({ navigation }) => (
            <IntroLoading
              onComplete={() => navigation.navigate('StartFirstDay')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="StartFirstDay">
          {({ navigation }) => (
            <StartFirstDay
              onNext={() => {
                  navigation.reset({
                      index: 0,
                      routes: [{ name: 'Home' }],
                  });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              onNavigateToToday={() => navigation.navigate('Today')}
              onNavigateToProfile={() => navigation.navigate('UserProfile')}
              onNavigateToBabyStatus={() => navigation.navigate('BabyStatus')}
              onNavigateToBabyTwin={() => navigation.navigate('BabyTwin')}
              onNavigateToPlanBirthday={() => navigation.navigate('PlanBirthday')}
              onNavigateToDebugLogs={() => navigation.navigate('DebugLogs')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Today">
          {({ navigation }) => (
            <TodayScreen 
              onNavigateToProfile={() => navigation.navigate('UserProfile')}
              onBackPress={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="UserProfile">
          {({ navigation }) => (
            <UserProfileScreen 
              onBack={() => navigation.goBack()}
              onNavigateToBabyTwin={() => navigation.navigate('BabyTwin')}
              onNavigateToMotherTwin={() => navigation.navigate('MotherTwin')}
              onNavigateToRefer={() => navigation.navigate('ReferApp')}
              onNavigateToAppSettings={() => navigation.navigate('AppSettings')}
              onNavigateToReminders={() => navigation.navigate('Reminders')}
              onNavigateToPrivacySettings={() => navigation.navigate('PrivacySettings')}
              onNavigateToPlanBirthday={() => navigation.navigate('PlanBirthday')}
              onNavigateToDebugLogs={() => navigation.navigate('DebugLogs')}
              onLogout={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="BabyTwin">
          {({ navigation }) => (
            <BabyTwinScreen 
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="MotherTwin">
          {({ navigation }) => (
            <MotherTwinScreen 
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ReferApp">
          {({ navigation }) => (
            <ReferAppScreen 
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="AppSettings">
          {({ navigation }) => (
            <AppSettingsScreen 
              onBack={() => navigation.goBack()}
              onNavigateToNotificationTime={() => navigation.navigate('NotificationTime')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="NotificationTime">
          {({ navigation }) => (
            <NotificationTimeScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Reminders">
          {({ navigation }) => (
            <RemindersScreen 
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="PrivacySettings">
          {({ navigation }) => (
            <PrivacySettingsScreen 
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="PlanBirthday">
          {({ navigation }) => (
            <PlanBirthdayScreen 
              onBack={() => navigation.goBack()}
              onConfirm={(date) => {
                console.log('Birth date confirmed:', date);
                // Don't navigate back - let the screen handle the state change
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Ads">
          {({ navigation }) => (
            <AdsScreen 
              onClose={() => navigation.navigate('Home')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="BabyStatus">
          {({ navigation }) => (
            <BabyStatusScreen
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="DebugLogs" component={DebugLogsScreen} options={{ headerShown: true, title: 'Debug Logs' }} />
        <Stack.Screen name="SignIn">
          {({ navigation }) => (
            <SignInScreen
              onLogin={() => navigation.replace('AuthLoading')}
              onForgotPassword={() => navigation.navigate('ForgotPassword')}
              onGoogleSignIn={() => {}}
              onSignUp={() => navigation.navigate('SignUp')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="SignUp">
          {({ navigation }) => (
            <SignUpScreen
              onSignUp={() => navigation.replace('AuthLoading')}
              onLogin={() => navigation.navigate('SignIn')}
              onGoogleSignIn={() => {}}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ForgotPassword">
          {({ navigation }) => (
            <ForgotPasswordScreen
              onBack={() => navigation.goBack()}
              onResetPassword={() => {}}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
