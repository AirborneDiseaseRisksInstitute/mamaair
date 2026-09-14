import React, { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  NavigationContainer,
  type ScreenLayoutArgs,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
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
import { ProfileInformationScreen } from '../screens/ProfileInformationScreen';
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
import { FeelingCheckInScreen } from '../screens/FeelingCheckInScreen';
import { WeeklySummaryScreen } from '../screens/WeeklySummaryScreen';
import { PlanProfileSetupScreen } from '../screens/PlanProfileSetupScreen';
import { FloatingActionButton } from '../components/ui';

import { AuthLoadingScreen } from '../screens/AuthLoadingScreen';
import { DEV_LOCAL_SESSION } from '../config/dev';
import { useUserStore } from '../store/useUserStore';
import { navigationRef } from './navigationRef';
import {
  consumePendingActionReminderPress,
  getInitialActionReminderPress,
  subscribeToActionReminderPress,
  scheduleReminders,
  type ActionReminderPressPayload,
} from '../services/NotificationService';
import { loadDailyPlanExperience } from '../services/recommendationExperience/DailyPlanRepository';
import { loadFeelingCheckInExperience } from '../services/recommendationExperience/FeelingCheckInRepository';
import { useRecommendationExperienceStore } from '../store/useRecommendationExperienceStore';
import {
  isWeeklyCheckpointAvailable,
  resolveLongitudinalJourneyStep,
} from '../services/recommendationExperience/LongitudinalJourneyRepository';
import { formatLocalDate } from '../utils/dateUtils';
import { ProductAnalytics } from '../services/recommendationExperience/ProductAnalytics';
import { resolvePregnancyProgression } from '../services/recommendationExperience/ProgressionRepository';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import {
  resolveQuickSymptomSource,
  shouldShowSymptomFab,
} from '../utils/symptomFabRoutes';
import { resolveIntroCompletionRoute } from '../utils/introNavigation';
import { resolveNextIntroStep } from '../utils/introFlow';
import { resolvePlanInputReadiness } from '../utils/planReadiness';

export type RootStackParamList = {
  AuthLoading: { authenticatedEmail?: string } | undefined;
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
  FeelingCheckIn: {
    source: 'intro' | 'home' | 'today' | 'app';
    mode?: 'full' | 'quick';
  };
  Home: undefined;
  Today:
    | {
        actionKey?: string;
        focus?: 'plan' | 'progress';
      }
    | undefined;
  PlanProfileSetup: undefined;
  UserProfile: undefined;
  ProfileInformation: undefined;
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
  WeeklySummary:
    | {
        pregnancyWeek?: number;
        endDate?: string;
        mode?: 'checkpoint' | 'review';
      }
    | undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

type AppScreenLayoutProps = ScreenLayoutArgs<
  RootStackParamList,
  keyof RootStackParamList,
  NativeStackNavigationOptions,
  NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>
>;

type HomeTodayNavigationTarget =
  | {
      screen: 'FeelingCheckIn';
      params: RootStackParamList['FeelingCheckIn'];
    }
  | {
      screen: 'WeeklySummary';
      params: NonNullable<RootStackParamList['WeeklySummary']>;
    }
  | {
      screen: 'Today';
      params: RootStackParamList['Today'];
    };

const resolveHomeTodayNavigationTarget =
  async (): Promise<HomeTodayNavigationTarget> => {
    const profile = useUserStore.getState().profile;
    const identity = {
      backendUserId: profile.backendUserId,
      email: profile.email,
    };
    const date = formatLocalDate(new Date());
    const store = useRecommendationExperienceStore.getState();
    store.ensureOwner(identity);
    const readiness = resolvePlanInputReadiness(
      profile,
      store.getCheckIn(date),
      store.pendingMommySymptomSelections[date] ?? null,
    );
    if (!readiness.ready) {
      return {
        screen: 'Today',
        params: { focus: 'plan' },
      };
    }
    const [plan, checkIn] = await Promise.all([
      loadDailyPlanExperience(identity, date, { inputReadiness: readiness })
        .then(result =>
          result.status === 'available' ? result.experience : null,
        )
        .catch(() => null),
      loadFeelingCheckInExperience(identity, date).catch(() => null),
    ]);
    const step = resolveLongitudinalJourneyStep({
      hasSavedCheckIn:
        Boolean(
          useRecommendationExperienceStore
            .getState()
            .getCheckIn(date),
        ) || checkIn?.recordState === 'recorded',
      plan,
      reminders:
        useRecommendationExperienceStore.getState().reminders[date] ?? {},
      restTimers:
        useRecommendationExperienceStore.getState().restTimers[date] ?? {},
      weeklyCheckpointAvailable: isWeeklyCheckpointAvailable(date),
    });

    if (step.kind === 'checkIn') {
      return {
        screen: 'FeelingCheckIn',
        params: {
          source: 'home',
          mode: 'full',
        },
      };
    }

    if (step.kind === 'weeklySummary') {
      return {
        screen: 'WeeklySummary',
        params: {
          mode: 'checkpoint',
        },
      };
    }

    return {
      screen: 'Today',
      params: {
        actionKey: step.kind === 'action' ? step.actionKey : undefined,
        focus: step.kind === 'dailyProgress' ? 'progress' : 'plan',
      },
    };
  };

const navigateToHomeTodayTarget = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  target: HomeTodayNavigationTarget,
) => {
  if (target.screen === 'FeelingCheckIn') {
    navigation.navigate('FeelingCheckIn', target.params);
    return;
  }

  if (target.screen === 'WeeklySummary') {
    navigation.navigate('WeeklySummary', target.params);
    return;
  }

  navigation.navigate('Today', target.params);
};

const AppScreenLayout = ({
  children,
  navigation,
  route,
}: AppScreenLayoutProps): React.ReactElement => (
  <>
    {children}
    {shouldShowSymptomFab(route.name) ? (
      <FloatingActionButton
        onPress={() =>
          navigation.navigate('FeelingCheckIn', {
            source: resolveQuickSymptomSource(route.name),
            mode: 'quick',
          })
        }
      />
    ) : null}
  </>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

const getNextIntroStep = (
  currentStepIndex: number,
): keyof RootStackParamList => {
  const { profile } = useUserStore.getState();
  return resolveNextIntroStep(currentStepIndex, profile);
};

export const Navigation: React.FC = () => {
  const sessionProfile = useUserStore(state => state.profile);
  const hasVisitedStep2 = useRef(false);
  const pendingReminder = useRef<ActionReminderPressPayload | null>(null);

  const openActionReminder = useCallback(
    (payload: ActionReminderPressPayload) => {
      if (!navigationRef.isReady()) {
        pendingReminder.current = payload;
        return;
      }
      navigationRef.navigate('Today', {
        actionKey: payload.actionKey,
        focus: 'plan',
      });
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = subscribeToActionReminderPress(openActionReminder);
    let pendingReadTimeout: ReturnType<typeof setTimeout> | null = null;

    const openRememberedReminder = () => {
      const payload = consumePendingActionReminderPress();
      if (payload) openActionReminder(payload);
    };

    getInitialActionReminderPress()
      .then(payload => {
        if (payload) openActionReminder(payload);
      })
      .catch(() => {});

    const appStateSubscription = AppState.addEventListener(
      'change',
      nextState => {
        if (nextState !== 'active') return;
        openRememberedReminder();
        pendingReadTimeout = setTimeout(openRememberedReminder, 250);
      },
    );

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      if (pendingReadTimeout) clearTimeout(pendingReadTimeout);
    };
  }, [openActionReminder]);

  useEffect(() => {
    scheduleReminders(
      sessionProfile.notifTimeFromHour ?? 9,
      sessionProfile.notifTimeFromMinute ?? 0,
      sessionProfile.notifDays ?? '1111111',
      sessionProfile.notifTimeToHour ?? 21,
      sessionProfile.notifTimeToMinute ?? 0,
    ).catch(() => {});
  }, [
    sessionProfile.notifDays,
    sessionProfile.notifTimeFromHour,
    sessionProfile.notifTimeFromMinute,
    sessionProfile.notifTimeToHour,
    sessionProfile.notifTimeToMinute,
    sessionProfile.timezone,
  ]);

  useEffect(() => {
    const identity = {
      backendUserId: sessionProfile.backendUserId,
      email: sessionProfile.email,
    };
    const pregnancyWeek =
      getCurrentPregnancyWeek(
        sessionProfile.pregnancyWeek,
        sessionProfile.pregnancyWeekSetDate,
      ) ?? 1;
    const progression = resolvePregnancyProgression(pregnancyWeek);
    const startedAt = Date.now();
    ProductAnalytics.track(identity, 'application_session_start', {
      pregnancyWeek,
      trimester: progression.trimester,
    });
    ProductAnalytics.track(identity, 'pregnancy_chapter_progression', {
      pregnancyWeek,
      trimester: progression.trimester,
    });
    return () => {
      ProductAnalytics.track(identity, 'session_duration', {
        durationSeconds: Math.max(
          1,
          Math.round((Date.now() - startedAt) / 1000),
        ),
      });
    };
  }, [
    sessionProfile.backendUserId,
    sessionProfile.email,
    sessionProfile.pregnancyWeek,
    sessionProfile.pregnancyWeekSetDate,
  ]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (!pendingReminder.current) return;
        const payload = pendingReminder.current;
        pendingReminder.current = null;
        openActionReminder(payload);
      }}
    >
      <Stack.Navigator
        initialRouteName="AuthLoading"
        screenLayout={AppScreenLayout}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 220,
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen name="AuthLoading">
          {({ navigation, route }) => (
            <AuthLoadingScreen
              authenticatedEmail={route.params?.authenticatedEmail}
              onComplete={target => {
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
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
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
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
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
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
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
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
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
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
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
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep11">
          {({ navigation }) => (
            <IntroStep11
              onNext={() => {
                const nextStep = getNextIntroStep(13);
                // @ts-ignore
                navigation.navigate(nextStep);
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep12">
          {({ navigation }) => (
            <IntroStep12
              onEnableNotifications={() =>
                navigation.navigate('IntroStep12NotificationTime')
              }
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
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
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="IntroStep14">
          {({ navigation }) => (
            <IntroStep14
              onNext={() =>
                navigation.navigate(resolveIntroCompletionRoute('completed'))
              }
              onBack={() => navigation.goBack()}
              onSkip={() =>
                navigation.navigate(resolveIntroCompletionRoute('skipped'))
              }
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
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    {
                      name: 'FeelingCheckIn',
                      params: {
                        source: 'intro',
                        mode: 'full',
                      },
                    },
                  ],
                });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="FeelingCheckIn">
          {({ navigation, route }) => (
            <FeelingCheckInScreen
              source={route.params.source}
              mode={route.params.mode}
              onComplete={() => {
                const isQuickEntry =
                  route.params.mode === 'quick' ||
                  (!route.params.mode && route.params.source !== 'intro');
                if (isQuickEntry) {
                  navigation.goBack();
                  return;
                }
                navigation.replace('Today');
              }}
              onSkip={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              onPrepareNavigateToToday={async () => {
                const target = await resolveHomeTodayNavigationTarget();
                return () => navigateToHomeTodayTarget(navigation, target);
              }}
              onNavigateToToday={() => navigation.navigate('Today')}
              onNavigateToProfile={() => navigation.navigate('UserProfile')}
              onNavigateToBabyStatus={() => navigation.navigate('BabyStatus')}
              onNavigateToPlanBirthday={() =>
                navigation.navigate('PlanBirthday')
              }
              onNavigateToHistoricalWeek={(pregnancyWeek, endDate) =>
                navigation.navigate('WeeklySummary', {
                  pregnancyWeek,
                  endDate,
                  mode: 'review',
                })
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Today">
          {({ navigation, route }) => (
            <TodayScreen
              initialActionKey={route.params?.actionKey}
              initialFocus={route.params?.focus}
              onCompletePlanProfile={() =>
                navigation.navigate('PlanProfileSetup')
              }
              onCompletePlanCheckIn={() =>
                navigation.navigate('FeelingCheckIn', {
                  source: 'today',
                  mode: 'full',
                })
              }
              onNavigateToProfile={() => navigation.navigate('UserProfile')}
              onNavigateToBabyStatus={() => navigation.navigate('BabyStatus')}
              onNavigateToSymptomsHistory={() =>
                navigation.navigate('SymptomsHistory')
              }
              onNavigateToWeeklySummary={() =>
                navigation.navigate('WeeklySummary', {
                  mode: 'checkpoint',
                })
              }
              onBackPress={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="PlanProfileSetup">
          {({ navigation }) => (
            <PlanProfileSetupScreen
              onComplete={() => {
                const profile = useUserStore.getState().profile;
                const date = formatLocalDate(new Date());
                const store = useRecommendationExperienceStore.getState();
                const identity = {
                  backendUserId: profile.backendUserId,
                  email: profile.email,
                };
                store.ensureOwner(identity);
                const readiness = resolvePlanInputReadiness(
                  profile,
                  store.getCheckIn(date),
                  store.pendingMommySymptomSelections[date] ?? null,
                );

                if (readiness.checkInReady) {
                  navigation.goBack();
                  return;
                }
                navigation.replace('FeelingCheckIn', {
                  source: 'today',
                  mode: 'full',
                });
              }}
              onCancel={() => navigation.goBack()}
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
              onNavigateToProfileInformation={() =>
                navigation.navigate('ProfileInformation')
              }
              onNavigateToReminders={() => navigation.navigate('Reminders')}
              onNavigateToPrivacySettings={() =>
                navigation.navigate('PrivacySettings')
              }
              onNavigateToPlanBirthday={() =>
                navigation.navigate('PlanBirthday')
              }
              onNavigateToSymptomsHistory={() =>
                navigation.navigate('SymptomsHistory')
              }
              onLogout={() => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: DEV_LOCAL_SESSION ? 'AuthLoading' : 'SignIn',
                    },
                  ],
                });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ProfileInformation">
          {({ navigation }) => (
            <ProfileInformationScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="SymptomsHistory">
          {({ navigation }) => (
            <SymptomsHistoryScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="WeeklySummary">
          {({ navigation, route }) => (
            <WeeklySummaryScreen
              pregnancyWeek={route.params?.pregnancyWeek}
              endDate={route.params?.endDate}
              mode={route.params?.mode}
              onBack={() => navigation.goBack()}
              onReturnToPath={() => navigation.navigate('Home')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="BabyTwin">
          {({ navigation }) => (
            <BabyTwinScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="MotherTwin">
          {({ navigation }) => (
            <MotherTwinScreen
              onBack={() => navigation.goBack()}
              onOpenWeeklyReport={() =>
                navigation.navigate('WeeklySummary', {
                  mode: 'checkpoint',
                })
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ReferApp">
          {({ navigation }) => (
            <ReferAppScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="AppSettings">
          {({ navigation }) => (
            <AppSettingsScreen
              onBack={() => navigation.goBack()}
              onNavigateToNotificationTime={() =>
                navigation.navigate('NotificationTime')
              }
              onAccountDeleted={() => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: DEV_LOCAL_SESSION ? 'AuthLoading' : 'SignIn',
                    },
                  ],
                });
              }}
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
            <RemindersScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="PrivacySettings">
          {({ navigation }) => (
            <PrivacySettingsScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="PlanBirthday">
          {({ navigation }) => (
            <PlanBirthdayScreen
              onBack={() => navigation.goBack()}
              onConfirm={_date => {
                // Don't navigate back - let the screen handle the state change
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Ads">
          {({ navigation }) => (
            <AdsScreen
              placement="standalone"
              onClose={() => navigation.navigate('Home')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="BabyStatus">
          {({ navigation }) => (
            <BabyStatusScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="SignIn">
          {({ navigation }) => (
            <SignInScreen
              onLogin={(email) =>
                navigation.replace('AuthLoading', {
                  authenticatedEmail: email,
                })
              }
              onForgotPassword={() => navigation.navigate('ForgotPassword')}
              onGoogleSignIn={() => {}}
              onSignUp={() => navigation.navigate('SignUp')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="SignUp">
          {({ navigation }) => (
            <SignUpScreen
              onSignUp={(email) =>
                navigation.replace('AuthLoading', {
                  authenticatedEmail: email,
                })
              }
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
