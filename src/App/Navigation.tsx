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
import { SymptomsHistoryScreen } from '../screens/SymptomsHistoryScreen';

import { AuthLoadingScreen } from '../screens/AuthLoadingScreen';
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
  SymptomsHistory: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Ordered intro step definitions — the actual flow order the user should experience.
// Language is FIRST so the rest of the intro is shown in the chosen language.
// Each step has a screen name, the index Navigation.tsx passes when leaving that screen,
// and a completion check against the profile.
type UserProfile = ReturnType<typeof useUserStore.getState>['profile'];
const INTRO_STEP_FLOW: Array<{
  fromIndex: number;
  screen: keyof RootStackParamList;
  isComplete: (p: UserProfile) => boolean;
}> = [
  { fromIndex: 4,  screen: 'IntroStep04',          isComplete: () => false }, // always shown — user picks language first
  { fromIndex: 2,  screen: 'IntroStep02',          isComplete: p => !!(p.name && p.email) },
  { fromIndex: 3,  screen: 'IntroStep03',          isComplete: p => !!(p.birthday && p.height && p.weight) },
  { fromIndex: 5,  screen: 'IntroStep05',          isComplete: p => !!(p.country && p.area) },
  { fromIndex: 6,  screen: 'IntroStep05Timezone',  isComplete: p => !!p.timezone },
  { fromIndex: 7,  screen: 'IntroStep06',          isComplete: p => !!(p.timeSpent && p.timeOfDay) },
  { fromIndex: 8,  screen: 'IntroStep07',          isComplete: p => !!(p.cookingMethod && p.ventilation) },
  { fromIndex: 9,  screen: 'IntroStep08',          isComplete: p => !!(p.sleepHours && p.activeHours) },
  { fromIndex: 10, screen: 'IntroStep09',          isComplete: p => !!p.workType },
  { fromIndex: 11, screen: 'IntroStep10',          isComplete: p => !!p.diet },
  { fromIndex: 12, screen: 'IntroStep10Pregnancy', isComplete: p => !!p.pregnancyNumber },
  { fromIndex: 13, screen: 'IntroStep11',          isComplete: p => !!p.pregnancyWeek },
  { fromIndex: 14, screen: 'IntroStep12',          isComplete: () => false }, // always shown
  { fromIndex: 15, screen: 'IntroStep13',          isComplete: () => false },
  { fromIndex: 16, screen: 'IntroStep14',          isComplete: () => false },
];

// Returns the next screen the user should visit, starting from after `currentStepIndex`.
// currentStepIndex = 1 means "just left IntroStep01" → scan from the top of the flow.
const getNextIntroStep = (currentStepIndex: number): keyof RootStackParamList => {
  const { profile } = useUserStore.getState();

  // Find where we are in the ordered flow; -1 means before the flow (step 01)
  const currentPos = INTRO_STEP_FLOW.findIndex(s => s.fromIndex === currentStepIndex);

  // Steps that still need to be visited (everything after current position)
  const remaining = currentPos === -1 ? INTRO_STEP_FLOW : INTRO_STEP_FLOW.slice(currentPos + 1);

  for (const step of remaining) {
    if (!step.isComplete(profile)) return step.screen;
  }

  return 'IntroStep14'; // fallback
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
          animationDuration: 220,
          freezeOnBlur: true,
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
              onNavigateToPlanBirthday={() => navigation.navigate('PlanBirthday')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Today">
          {({ navigation }) => (
            <TodayScreen
              onNavigateToProfile={() => navigation.navigate('UserProfile')}
              onNavigateToBabyStatus={() => navigation.navigate('BabyStatus')}
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
              onNavigateToSymptomsHistory={() => navigation.navigate('SymptomsHistory')}
              onLogout={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="SymptomsHistory">
          {({ navigation }) => (
            <SymptomsHistoryScreen onBack={() => navigation.goBack()} />
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
