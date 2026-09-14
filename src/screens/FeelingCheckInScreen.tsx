import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { FeelingCheckInForm } from '../components/recommendations/FeelingCheckInForm';
import {
  Button,
  FixedButtonContainer,
  useToast,
} from '../components/ui';
import {
  loadFeelingCheckInExperience,
  submitFeelingCheckIn,
} from '../services/recommendationExperience/FeelingCheckInRepository';
import { useUserStore } from '../store/useUserStore';
import { formatLocalDate } from '../utils/dateUtils';
import { radius, spacing, useTheme } from '../theme';
import type {
  CheckInItemGroup,
  FeelingCheckInExperience,
  FeelingCheckInSelection,
  RecommendationExperienceIdentity,
} from '../types/recommendationExperience';
import { ProductAnalytics } from '../services/recommendationExperience/ProductAnalytics';

interface FeelingCheckInScreenProps {
  source: 'intro' | 'home' | 'today' | 'app';
  mode?: 'full' | 'quick';
  onComplete: () => void;
  onSkip: () => void;
}

const CHECK_IN_STEPS: CheckInItemGroup[] = [
  'wellbeing',
  'physical',
  'warning',
];

export const FeelingCheckInScreen: React.FC<
  FeelingCheckInScreenProps
> = ({ source, mode, onComplete, onSkip }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const profile = useUserStore(state => state.profile);
  const [experience, setExperience] =
    useState<FeelingCheckInExperience | null>(null);
  const [selection, setSelection] =
    useState<FeelingCheckInSelection | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const [quickSectionOffsets, setQuickSectionOffsets] = useState({
    physical: 0,
    warning: 0,
  });
  const stepAnimation = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const flowStartedAt = useRef(Date.now());

  const date = useMemo(() => formatLocalDate(new Date()), []);
  const identity = useMemo<RecommendationExperienceIdentity>(
    () => ({
      backendUserId: profile.backendUserId,
      email: profile.email,
    }),
    [profile.backendUserId, profile.email],
  );
  const currentStep = CHECK_IN_STEPS[stepIndex];
  const quickSymptomMode =
    mode === 'quick' ||
    (!mode && source !== 'intro');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const result = await loadFeelingCheckInExperience(
        identity,
        date,
      );
      setExperience(result);
      setSelection(result.selection);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [date, identity]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    flowStartedAt.current = Date.now();
    ProductAnalytics.track(identity, 'daily_flow_start', {
      source,
    });
  }, [identity, source]);

  const moveToStep = (nextIndex: number) => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    stepAnimation.setValue(0);
    setStepIndex(nextIndex);
    Animated.timing(stepAnimation, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (!experience || !selection || submitting) return;
    setSubmitting(true);

    try {
      const result = await submitFeelingCheckIn(
        identity,
        date,
        experience,
        selection,
        quickSymptomMode
          ? { writeScope: 'symptoms' }
          : undefined,
      );
      showToast(
        result.symptomsPendingSync
          ? {
              type: 'info',
              title: t('feeling_checkin.offline_saved_title'),
              message: t('feeling_checkin.offline_saved_message'),
              duration: 4500,
            }
          : {
              type: 'success',
              title: t(
                quickSymptomMode
                  ? 'feeling_checkin.symptoms_saved_title'
                  : 'feeling_checkin.ready_title',
              ),
              message: t(
                quickSymptomMode
                  ? 'feeling_checkin.symptoms_saved_message'
                  : 'feeling_checkin.ready_message',
              ),
            },
      );
      ProductAnalytics.track(identity, 'daily_flow_complete', {
        durationSeconds: Math.max(
          1,
          Math.round(
            (Date.now() - flowStartedAt.current) / 1000,
          ),
        ),
      });
      onComplete();
    } catch {
      showToast({
        type: 'error',
        title: t('feeling_checkin.save_failed_title'),
        message: t('feeling_checkin.save_failed_message'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (quickSymptomMode) {
      handleSubmit();
      return;
    }
    if (stepIndex < CHECK_IN_STEPS.length - 1) {
      moveToStep(stepIndex + 1);
      return;
    }
    handleSubmit();
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onSkip();
      return;
    }
    moveToStep(stepIndex - 1);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.neutral50,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          height: 56,
          paddingHorizontal: spacing('sm'),
          backgroundColor: '#FFFFFF',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral200,
        },
        headerSide: {
          width: 88,
          height: 56,
          justifyContent: 'center',
        },
        headerSideRight: {
          alignItems: 'flex-end',
        },
        backButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 22,
        },
        headerTitle: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 17,
          textAlign: 'center',
        },
        skipButton: {
          width: 88,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        skipText: {
          color: theme.colors.orange600,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
          textAlign: 'center',
        },
        progressArea: {
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('md'),
          paddingBottom: spacing('sm'),
          backgroundColor: '#FFFFFF',
        },
        progressLabelRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing('sm'),
        },
        progressLabel: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        progressStep: {
          color: theme.colors.orange600,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
        },
        progressTrack: {
          flexDirection: 'row',
          gap: spacing('xs'),
        },
        progressSegment: {
          flex: 1,
          height: 5,
          borderRadius: 3,
          backgroundColor: theme.colors.neutral200,
        },
        progressSegmentActive: {
          backgroundColor: theme.colors.orange500,
        },
        content: {
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('lg'),
          paddingBottom: spacing('lg'),
        },
        quickContent: {
          paddingTop: spacing('md'),
        },
        introTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 25,
          lineHeight: 32,
          marginBottom: spacing('xs'),
        },
        introText: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 14,
          lineHeight: 21,
          marginBottom: spacing('lg'),
        },
        quickIntroTitle: {
          fontSize: 23,
          lineHeight: 29,
        },
        quickIntroText: {
          marginBottom: spacing('md'),
        },
        animatedContent: {
          width: '100%',
        },
        quickSectionTitle: {
          marginTop: spacing('lg'),
          marginBottom: spacing('sm'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        quickWarningTitle: {
          color: '#8A2525',
        },
        quickJumps: {
          flexDirection: 'row',
          marginBottom: spacing('sm'),
          gap: spacing('sm'),
        },
        quickJump: {
          minHeight: 44,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing('sm'),
          borderRadius: 22,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral300,
          backgroundColor: '#FFFFFF',
        },
        quickJumpWarning: {
          borderColor: '#E2BFC2',
          backgroundColor: '#FFF7F7',
        },
        quickJumpText: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
          textAlign: 'center',
        },
        quickJumpWarningText: {
          color: '#8A2525',
        },
        center: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing('xl'),
        },
        loadingText: {
          marginTop: spacing('md'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 14,
        },
        errorCard: {
          width: '100%',
          alignItems: 'center',
          padding: spacing('lg'),
          borderRadius: radius('lg'),
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: theme.colors.neutral200,
        },
        errorText: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
          marginBottom: spacing('md'),
        },
        retryButton: {
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: spacing('lg'),
          borderRadius: 22,
          backgroundColor: theme.colors.orange100,
        },
        retryText: {
          color: theme.colors.orange600,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 15,
        },
      }),
    [theme],
  );

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={theme.colors.orange500}
          />
          <Text style={styles.loadingText}>
            {t('feeling_checkin.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadFailed || !experience || !selection) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
      >
        <View style={styles.center}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {t('feeling_checkin.load_failed')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={load}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                {t('feeling_checkin.try_again')}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const stepTitle = t(
    `feeling_checkin.step_${currentStep}_title`,
  );
  const stepDescription = t(
    `feeling_checkin.step_${currentStep}_description`,
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={handleBack}
            style={styles.backButton}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={18}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {t(
            quickSymptomMode
              ? 'feeling_checkin.quick_header'
              : 'feeling_checkin.header',
          )}
        </Text>
        <View
          style={[styles.headerSide, styles.headerSideRight]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={onSkip}
            style={styles.skipButton}
          >
            <Text numberOfLines={1} style={styles.skipText}>
              {source === 'intro'
                ? t('feeling_checkin.skip_for_now')
                : t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>

      {!quickSymptomMode ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: CHECK_IN_STEPS.length,
            now: stepIndex + 1,
          }}
          style={styles.progressArea}
        >
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              {t('feeling_checkin.progress_label')}
            </Text>
            <Text style={styles.progressStep}>
              {t('feeling_checkin.progress_step', {
                current: stepIndex + 1,
                total: CHECK_IN_STEPS.length,
              })}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            {CHECK_IN_STEPS.map((step, index) => (
              <View
                key={step}
                style={[
                  styles.progressSegment,
                  index <= stepIndex &&
                    styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          quickSymptomMode && styles.quickContent,
          {
            paddingBottom:
              footerHeight + spacing('lg'),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: stepAnimation,
              transform: [
                {
                  translateY: stepAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.introTitle,
              quickSymptomMode && styles.quickIntroTitle,
            ]}
          >
            {quickSymptomMode
              ? t('feeling_checkin.quick_title')
              : stepTitle}
          </Text>
          <Text
            style={[
              styles.introText,
              quickSymptomMode && styles.quickIntroText,
            ]}
          >
            {quickSymptomMode
              ? t('feeling_checkin.quick_description')
              : stepDescription}
          </Text>
          {quickSymptomMode ? (
            <>
              <View style={styles.quickJumps}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    scrollRef.current?.scrollTo({
                      y: Math.max(
                        0,
                        quickSectionOffsets.physical - spacing('sm'),
                      ),
                      animated: true,
                    })
                  }
                  style={styles.quickJump}
                >
                  <Text style={styles.quickJumpText}>
                    {t('feeling_checkin.mother_symptoms')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    scrollRef.current?.scrollTo({
                      y: Math.max(
                        0,
                        quickSectionOffsets.warning - spacing('sm'),
                      ),
                      animated: true,
                    })
                  }
                  style={[
                    styles.quickJump,
                    styles.quickJumpWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickJumpText,
                      styles.quickJumpWarningText,
                    ]}
                  >
                    {t('feeling_checkin.warning_signs')}
                  </Text>
                </Pressable>
              </View>
              <View
                onLayout={event => {
                  const physical =
                    event.nativeEvent.layout.y;
                  setQuickSectionOffsets(previous => ({
                    ...previous,
                    physical,
                  }));
                }}
              >
                <Text style={styles.quickSectionTitle}>
                  {t('feeling_checkin.mother_symptoms')}
                </Text>
                <FeelingCheckInForm
                  step="physical"
                  experience={experience}
                  selection={selection}
                  onChange={setSelection}
                  disabled={submitting}
                  showNoneOption={false}
                />
              </View>
              <View
                onLayout={event => {
                  const warning =
                    event.nativeEvent.layout.y;
                  setQuickSectionOffsets(previous => ({
                    ...previous,
                    warning,
                  }));
                }}
              >
                <Text
                  style={[
                    styles.quickSectionTitle,
                    styles.quickWarningTitle,
                  ]}
                >
                  {t('feeling_checkin.warning_signs')}
                </Text>
                <FeelingCheckInForm
                  step="warning"
                  experience={experience}
                  selection={selection}
                  onChange={setSelection}
                  disabled={submitting}
                  showNoneOption={false}
                />
              </View>
            </>
          ) : (
            <FeelingCheckInForm
              step={currentStep}
              experience={experience}
              selection={selection}
              onChange={setSelection}
              disabled={submitting}
            />
          )}
        </Animated.View>
      </ScrollView>

      <FixedButtonContainer
        onLayout={event =>
          setFooterHeight(event.nativeEvent.layout.height)
        }
      >
        <Button
          title={t(
            submitting
              ? 'feeling_checkin.saving'
              : quickSymptomMode
              ? 'feeling_checkin.save_symptoms'
              : stepIndex === CHECK_IN_STEPS.length - 1
              ? 'feeling_checkin.build_plan'
              : 'common.continue',
          )}
          onPress={handleContinue}
          disabled={submitting}
        />
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
