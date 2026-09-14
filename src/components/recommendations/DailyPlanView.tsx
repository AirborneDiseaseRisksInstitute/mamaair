import React, { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBell,
  faBrain,
  faCalendarCheck,
  faCheck,
  faClock,
  faHeart,
  faSnowflake,
} from '@fortawesome/free-solid-svg-icons';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import {
  BEHAVIOUR_SVG,
  CONGRATS_SVG,
  DIET_SVG,
  RUNNING_SVG,
} from '../../utils/svgIcons';
import { Button, ReminderTimePicker, useToast } from '../ui';
import { radius, spacing, useTheme } from '../../theme';
import type {
  ActionReminderRecord,
  DailyActionState,
  DailyActionDomain,
  DailyPlanAction,
  DailyPlanExperience,
  RecommendationExperienceIdentity,
  RestTimerRecord,
} from '../../types/recommendationExperience';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import {
  cancelActionReminder,
  cancelEveningCareReminder,
  cancelRestTimerNotification,
  scheduleActionReminder,
  scheduleRestTimerNotification,
} from '../../services/NotificationService';
import { getPersistentStreak } from '../../services/recommendationExperience/ProgressionRepository';
import { completedRiskImpactValue } from '../../services/recommendationExperience/DailyPlanRepository';
import {
  shouldShowTaskActions,
  supportsRestTimer,
} from '../../services/recommendationExperience/DailyPlanInteractionPresenter';
const EMPTY_REMINDERS: Record<string, ActionReminderRecord> = {};
const EMPTY_REST_TIMERS: Record<string, RestTimerRecord> = {};
const INLINE_ADDITIONAL_ACTIONS_ENABLED = false;

interface DailyPlanViewProps {
  experience: DailyPlanExperience;
  onToggleAction: (
    action: DailyPlanAction,
    completed: boolean,
  ) => void | Promise<boolean>;
  onChangeActionState: (
    action: DailyPlanAction,
    state: DailyActionState,
  ) => void | Promise<boolean>;
  dailyWinVisible: boolean;
  onCloseDailyWin: () => void;
  streakDays: number;
  onOpenWeeklySummary?: () => void;
  highlightedActionKey?: string;
  onHighlightedActionLayout?: (offsetY: number) => void;
  identity: RecommendationExperienceIdentity;
}

const DOMAIN_ORDER: DailyActionDomain[] = [
  'diet',
  'activity',
  'behaviour',
  'wellbeing',
  // Service/treatment escalation is disabled for the current release.
  // Restore this entry when the backend-supported experience is approved.
  // 'service',
];

const DOMAIN_CONFIG: Record<
  DailyActionDomain,
  {
    color: string;
    background: string;
    iconBackground: string;
    svg?: string;
  }
> = {
  diet: {
    color: '#2E7D4A',
    background: '#F2FAF5',
    iconBackground: '#D8F0E0',
    svg: DIET_SVG,
  },
  activity: {
    color: '#946000',
    background: '#FFF9EC',
    iconBackground: '#FFE9B0',
    svg: RUNNING_SVG,
  },
  behaviour: {
    color: '#A83149',
    background: '#FFF5F7',
    iconBackground: '#FFDCE3',
    svg: BEHAVIOUR_SVG,
  },
  wellbeing: {
    color: '#70428F',
    background: '#F8F3FB',
    iconBackground: '#EADDF3',
  },
  service: {
    color: '#48607A',
    background: '#F3F7FA',
    iconBackground: '#DDE8F0',
  },
};

const DomainIcon: React.FC<{
  domain: DailyActionDomain;
  size?: number;
}> = ({ domain, size = 20 }) => {
  const config = DOMAIN_CONFIG[domain];
  if (config.svg) {
    return <SvgXml xml={config.svg} width={size} height={size} />;
  }
  return (
    <FontAwesomeIcon
      icon={domain === 'wellbeing' ? faBrain : faHeart}
      size={Math.round(size * 0.76)}
      color={config.color}
    />
  );
};

export const DailyPlanView: React.FC<DailyPlanViewProps> = ({
  experience,
  onToggleAction,
  onChangeActionState,
  dailyWinVisible,
  onCloseDailyWin,
  streakDays,
  onOpenWeeklySummary,
  highlightedActionKey,
  onHighlightedActionLayout,
  identity,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [reminderAction, setReminderAction] = useState<DailyPlanAction | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());
  const [streakProgress, setStreakProgress] = useState(() => ({
    days: streakDays,
    freezeAvailable: true,
    freezeUsed: false,
  }));
  const reminders = useRecommendationExperienceStore(
    state => state.reminders[experience.date] ?? EMPTY_REMINDERS,
  );
  const restTimers = useRecommendationExperienceStore(
    state => state.restTimers[experience.date] ?? EMPTY_REST_TIMERS,
  );
  const actionCompletions = useRecommendationExperienceStore(
    state => state.actionCompletions,
  );

  const visiblePrimaryActions = useMemo(
    () =>
      experience.primaryActions.filter(action => action.domain !== 'service'),
    [experience.primaryActions],
  );
  const completedCount = visiblePrimaryActions.filter(
    action => action.completed,
  ).length;
  const hasDailyWin = completedCount > 0;
  const completedRiskImpact = completedRiskImpactValue(experience);
  const hasAppliedRiskImpact = completedRiskImpact !== 0;
  const plannedCount = visiblePrimaryActions.filter(
    action => action.state === 'planned',
  ).length;
  const groupedActions = useMemo(() => {
    const rankedDomains = visiblePrimaryActions.reduce<DailyActionDomain[]>(
      (domains, action) =>
        domains.includes(action.domain) ? domains : [...domains, action.domain],
      [],
    );
    return rankedDomains.map(domain => ({
      domain,
      actions: visiblePrimaryActions.filter(action => action.domain === domain),
    }));
  }, [visiblePrimaryActions]);
  const sharedPlanContexts = useMemo(() => {
    const counts = visiblePrimaryActions.reduce<Record<string, number>>(
      (result, action) => {
        const label = action.contextLabel?.trim();
        if (label) result[label] = (result[label] ?? 0) + 1;
        return result;
      },
      {},
    );
    return Object.keys(counts).filter(label => counts[label] > 1);
  }, [visiblePrimaryActions]);
  const sharedPlanContextSet = useMemo(
    () => new Set(sharedPlanContexts),
    [sharedPlanContexts],
  );
  const groupedAdditionalActions = useMemo(
    () =>
      DOMAIN_ORDER.map(domain => ({
        domain,
        actions: experience.additionalActions[domain] ?? [],
      })).filter(group => group.actions.length > 0),
    [experience.additionalActions],
  );

  const hasRunningTimer = Object.values(restTimers).some(
    timer => timer.status === 'running',
  );

  useEffect(() => {
    if (!hasRunningTimer) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasRunningTimer]);

  useEffect(() => {
    setStreakProgress(getPersistentStreak(identity, experience.date));
  }, [actionCompletions, experience.date, identity]);

  useEffect(() => {
    Object.values(restTimers).forEach(timer => {
      if (
        timer.status === 'running' &&
        new Date(timer.endsAt).getTime() <= now
      ) {
        useRecommendationExperienceStore.getState().saveRestTimer({
          ...timer,
          status: 'ready',
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }, [now, restTimers]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: spacing('sm'),
          paddingTop: spacing('lg'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.neutral200,
        },
        planSection: {
          width: '100%',
        },
        headingRow: {
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
        },
        heading: {
          flex: 1,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
        progressCount: {
          paddingHorizontal: spacing('sm'),
          paddingVertical: 5,
          borderRadius: 14,
          overflow: 'hidden',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 11,
        },
        planOverview: {
          marginTop: spacing('xs'),
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.orange200,
          borderRadius: 8,
          backgroundColor: theme.colors.orange50,
        },
        progressTrack: {
          height: 4,
          overflow: 'hidden',
          backgroundColor: theme.colors.orange100,
        },
        progressFill: {
          height: 4,
          backgroundColor: theme.colors.orange500,
        },
        statusRow: {
          minHeight: 50,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
        },
        statusIcon: {
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          backgroundColor: theme.colors.orange100,
        },
        statusCopy: {
          flex: 1,
        },
        statusTitle: {
          color: theme.colors.orange800,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
        },
        statusDetail: {
          marginTop: 1,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
        },
        streak: {
          marginTop: 2,
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
        },
        progressValue: {
          paddingHorizontal: spacing('sm'),
          paddingVertical: 5,
          borderRadius: 13,
          overflow: 'hidden',
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          backgroundColor: theme.colors.orange100,
        },
        rhythmRow: {
          minHeight: 42,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.orange100,
        },
        focusRow: {
          minHeight: 38,
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: spacing('md'),
          paddingVertical: spacing('xs'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.orange100,
        },
        focusLabel: {
          marginRight: spacing('xs'),
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 9,
          lineHeight: 15,
          textTransform: 'uppercase',
        },
        focusText: {
          flex: 1,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
          lineHeight: 15,
        },
        rhythmCopy: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        rhythmText: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
        },
        groups: {
          paddingTop: spacing('md'),
          paddingBottom: spacing('sm'),
        },
        domainSection: {
          paddingTop: spacing('xs'),
        },
        domainSectionSpaced: {
          marginTop: spacing('sm'),
          paddingTop: spacing('md'),
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral200,
        },
        domainHeader: {
          minHeight: 34,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          borderLeftWidth: 3,
        },
        domainIcon: {
          width: 23,
          height: 23,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('xs'),
        },
        domainName: {
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
          letterSpacing: 0.2,
        },
        taskRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: spacing('xs'),
          paddingVertical: spacing('sm'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral100,
        },
        taskRowAlternate: {
          backgroundColor: '#FCFCFC',
        },
        taskRowHighlighted: {
          backgroundColor: theme.colors.orange50,
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.orange500,
        },
        taskCopy: {
          flex: 1,
          paddingTop: 1,
        },
        taskTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
          lineHeight: 18,
        },
        taskPurpose: {
          marginTop: 4,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 17,
        },
        taskTitlePlanned: {
          color: theme.colors.orange800,
        },
        actionButtons: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing('xs'),
          marginTop: spacing('sm'),
        },
        reminderButton: {
          minHeight: 29,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          paddingHorizontal: spacing('sm'),
          borderRadius: 15,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
          backgroundColor: theme.colors.neutral50,
        },
        reminderButtonText: {
          color: theme.colors.neutral600,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
        },
        reminderButtonActive: {
          borderColor: theme.colors.orange200,
          backgroundColor: theme.colors.orange50,
        },
        timerButton: {
          minHeight: 29,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          paddingHorizontal: spacing('sm'),
          borderRadius: 15,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '#D9CCE2',
          backgroundColor: '#F8F3FB',
        },
        timerButtonReady: {
          borderColor: '#BBDDC7',
          backgroundColor: '#F1FAF4',
        },
        timerButtonText: {
          color: '#70428F',
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
        },
        plannedLabel: {
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
        },
        sectionSubheading: {
          marginTop: spacing('md'),
          marginBottom: spacing('xs'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 11,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        taskMetadata: {
          marginTop: 4,
          color: theme.colors.neutral600,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
          lineHeight: 15,
        },
        completionButton: {
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('xs'),
        },
        completionIndicator: {
          width: 20,
          height: 20,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        completionIndicatorPending: {
          borderWidth: 1.5,
          borderColor: theme.colors.orange300,
          backgroundColor: '#FFFFFF',
        },
        completionIndicatorDone: {
          backgroundColor: theme.colors.orange500,
        },
        completionIndicatorPlanned: {
          borderWidth: 1.5,
          borderColor: theme.colors.orange500,
          backgroundColor: theme.colors.orange50,
        },
        modalOverlay: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing('lg'),
          backgroundColor: 'rgba(18, 18, 18, 0.48)',
        },
        modalCard: {
          width: '100%',
          maxWidth: 420,
          alignItems: 'center',
          padding: spacing('lg'),
          borderRadius: radius('lg'),
          backgroundColor: '#FFFFFF',
        },
        modalIllustration: {
          width: 150,
          height: 125,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing('sm'),
        },
        modalTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 25,
          lineHeight: 32,
          textAlign: 'center',
        },
        modalBody: {
          marginTop: spacing('xs'),
          marginBottom: spacing('lg'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 14,
          lineHeight: 21,
          textAlign: 'center',
        },
        modalButton: {
          width: '100%',
        },
        weeklyButton: {
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing('sm'),
        },
        weeklyButtonText: {
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
      }),
    [theme],
  );

  const toggleAction = async (action: DailyPlanAction) => {
    if (
      action.completed &&
      action.backendReference?.kind === 'recommendation'
    ) {
      return;
    }
    const completing = !action.completed;
    const changed = await onToggleAction(action, completing);
    if (changed === false) return;

    if (completing) {
      const reminder = reminders[action.key];
      if (reminder) {
        cancelActionReminder(reminder.notificationId).catch(() => {});
        useRecommendationExperienceStore
          .getState()
          .removeReminder(experience.date, action.key);
      }
      const restTimer = restTimers[action.key];
      if (restTimer?.status === 'running') {
        cancelRestTimerNotification(experience.date, action.key).catch(
          () => {},
        );
        useRecommendationExperienceStore
          .getState()
          .removeRestTimer(experience.date, action.key);
      } else if (restTimer?.status === 'ready') {
        useRecommendationExperienceStore.getState().saveRestTimer({
          ...restTimer,
          status: 'completed',
          updatedAt: new Date().toISOString(),
        });
      }
      cancelEveningCareReminder(experience.date).catch(() => {});
    } else if (restTimers[action.key]?.status === 'completed') {
      useRecommendationExperienceStore
        .getState()
        .removeRestTimer(experience.date, action.key);
    }
    AccessibilityInfo.announceForAccessibility(
      action.completed
        ? t('today.action_marked_incomplete')
        : t('today.action_completed_announcement'),
    );
  };

  const handleReminderConfirm = async (hour: number, minute: number) => {
    const action = reminderAction;
    if (!action) return;
    const title = action.title;
    const time = `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
    setReminderAction(null);
    const result = await scheduleActionReminder({
      date: experience.date,
      actionKey: action.key,
      title,
      hour,
      minute,
    });

    if (result.status === 'failed') {
      showToast({
        type: 'error',
        title: t('today.reminder_not_set'),
        message: t('today.reminder_try_again'),
      });
      return;
    }

    useRecommendationExperienceStore.getState().saveReminder({
      actionKey: action.key,
      date: experience.date,
      notificationId: result.notificationId,
      hour,
      minute,
      scheduledFor: result.scheduledFor,
      status: result.status === 'scheduled' ? 'scheduled' : 'planned',
      updatedAt: new Date().toISOString(),
    });
    if (action.state === 'pending') {
      onChangeActionState(action, 'planned');
    }
    showToast({
      type: 'success',
      title:
        result.status === 'scheduled'
          ? t('today.reminder_ready')
          : t('today.action_planned'),
      message:
        result.status === 'scheduled'
          ? t('today.reminder_set', { time })
          : t('today.reminder_permission_note'),
    });
  };

  const removeReminder = async () => {
    const action = reminderAction;
    if (!action) return;
    const reminder = reminders[action.key];
    setReminderAction(null);
    if (reminder) {
      await cancelActionReminder(reminder.notificationId);
      useRecommendationExperienceStore
        .getState()
        .removeReminder(experience.date, action.key);
    }
    if (action.state === 'planned' && !restTimers[action.key]) {
      onChangeActionState(action, 'pending');
    }
    showToast({
      type: 'success',
      title: t('today.reminder_removed'),
      message: t('today.reminder_removed_body'),
    });
  };

  const timerLabel = (action: DailyPlanAction): string => {
    const timer = restTimers[action.key];
    if (!timer) return t('today.start_rest_timer');
    if (timer.status === 'ready') return t('today.finish_rest');
    if (timer.status === 'completed') return t('today.rest_completed');
    const remaining = Math.max(
      0,
      Math.ceil((new Date(timer.endsAt).getTime() - now) / 1000),
    );
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return t('today.rest_time_left', {
      time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    });
  };

  const handleRestTimer = async (action: DailyPlanAction) => {
    const timer = restTimers[action.key];
    if (timer?.status === 'ready') {
      const changed = await onChangeActionState(action, 'completed');
      if (changed === false) return;
      useRecommendationExperienceStore.getState().saveRestTimer({
        ...timer,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });
      cancelRestTimerNotification(experience.date, action.key).catch(() => {});
      const reminder = reminders[action.key];
      if (reminder) {
        cancelActionReminder(reminder.notificationId).catch(() => {});
        useRecommendationExperienceStore
          .getState()
          .removeReminder(experience.date, action.key);
      }
      cancelEveningCareReminder(experience.date).catch(() => {});
      return;
    }
    if (timer?.status === 'running' || timer?.status === 'completed') return;

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + 10 * 60 * 1000);
    useRecommendationExperienceStore.getState().saveRestTimer({
      actionKey: action.key,
      date: experience.date,
      durationSeconds: 10 * 60,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'running',
      updatedAt: startedAt.toISOString(),
    });
    scheduleRestTimerNotification({
      date: experience.date,
      actionKey: action.key,
      title: action.title,
      endsAt: endsAt.toISOString(),
    }).catch(() => {});
    if (action.state === 'pending') {
      onChangeActionState(action, 'planned');
    }
    showToast({
      type: 'success',
      title: t('today.rest_timer_started'),
      message: t('today.rest_timer_started_body'),
    });
  };

  const metadataLabel = (action: DailyPlanAction): string | null => {
    const metadata = [
      action.timingLabel,
      action.durationMinutes !== undefined
        ? `${action.durationMinutes} min`
        : action.durationLabel,
      action.contextLabel && !sharedPlanContextSet.has(action.contextLabel)
        ? action.contextLabel
        : undefined,
    ].filter(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    );
    return metadata.length ? metadata.join(' · ') : null;
  };

  const formatRiskImpact = (value: number): string =>
    `${value < 0 ? '-' : '+'}${Math.abs(value).toFixed(1)}%`;

  const renderActionRow = (
    action: DailyPlanAction,
    index: number,
    interactive = true,
  ) => {
    const config = DOMAIN_CONFIG[action.domain];
    const metadata = metadataLabel(action);
    const recommendationCompletionIsFinal =
      action.completed && action.backendReference?.kind === 'recommendation';
    const isHighlighted = action.key === highlightedActionKey;
    return (
      <View
        key={action.key}
        onLayout={
          isHighlighted
            ? event => onHighlightedActionLayout?.(event.nativeEvent.layout.y)
            : undefined
        }
        style={[
          styles.taskRow,
          index % 2 === 1 && styles.taskRowAlternate,
          isHighlighted && styles.taskRowHighlighted,
          isHighlighted && {
            backgroundColor: config.background,
            borderLeftColor: config.color,
          },
        ]}
      >
        {interactive ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: action.completed,
              disabled: recommendationCompletionIsFinal,
            }}
            accessibilityLabel={
              recommendationCompletionIsFinal
                ? t('today.action_completed_announcement')
                : action.completed
                ? t('today.mark_not_complete')
                : t('today.action_completion_label', {
                    action: action.title,
                  })
            }
            disabled={recommendationCompletionIsFinal}
            hitSlop={6}
            onPress={() => toggleAction(action)}
            style={styles.completionButton}
          >
            <View
              style={[
                styles.completionIndicator,
                action.completed
                  ? styles.completionIndicatorDone
                  : action.state === 'planned'
                  ? styles.completionIndicatorPlanned
                  : styles.completionIndicatorPending,
                action.completed
                  ? { backgroundColor: config.color }
                  : action.state === 'planned'
                  ? {
                      borderColor: config.color,
                      backgroundColor: config.background,
                    }
                  : {
                      borderColor: config.iconBackground,
                    },
              ]}
            >
              {action.completed ? (
                <FontAwesomeIcon icon={faCheck} size={10} color="#FFFFFF" />
              ) : action.state === 'planned' ? (
                <FontAwesomeIcon
                  icon={faCalendarCheck}
                  size={9}
                  color={config.color}
                />
              ) : null}
            </View>
          </Pressable>
        ) : (
          <View style={styles.completionButton}>
            <View
              style={[
                styles.completionIndicator,
                styles.completionIndicatorPending,
              ]}
            >
              <DomainIcon domain={action.domain} size={12} />
            </View>
          </View>
        )}
        <View style={styles.taskCopy}>
          <Text
            style={[
              styles.taskTitle,
              action.state === 'planned' && styles.taskTitlePlanned,
              action.state === 'planned' && { color: config.color },
            ]}
          >
            {action.title}
          </Text>
          {metadata ? (
            <Text style={styles.taskMetadata}>{metadata}</Text>
          ) : null}
          {action.purpose ? (
            <Text style={styles.taskPurpose}>{action.purpose}</Text>
          ) : null}
          {shouldShowTaskActions(action, interactive) ? (
            <View style={styles.actionButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t(
                  reminders[action.key]
                    ? 'today.edit_reminder'
                    : 'today.set_reminder',
                )}: ${action.title}`}
                onPress={() => setReminderAction(action)}
                style={[
                  styles.reminderButton,
                  reminders[action.key] && styles.reminderButtonActive,
                  {
                    borderColor: reminders[action.key]
                      ? config.color
                      : config.iconBackground,
                    backgroundColor: config.background,
                  },
                ]}
              >
                <FontAwesomeIcon
                  icon={faBell}
                  size={10}
                  color={config.color}
                />
                <Text
                  style={[styles.reminderButtonText, { color: config.color }]}
                >
                  {reminders[action.key]
                    ? `${reminders[action.key].hour
                        .toString()
                        .padStart(2, '0')}:${reminders[action.key].minute
                        .toString()
                        .padStart(2, '0')}`
                    : t('today.set_reminder')}
                </Text>
              </Pressable>
              {supportsRestTimer(action) ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleRestTimer(action)}
                  style={[
                    styles.timerButton,
                    (restTimers[action.key]?.status === 'ready' ||
                      restTimers[action.key]?.status === 'completed') &&
                      styles.timerButtonReady,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={
                      restTimers[action.key]?.status === 'ready' ||
                      restTimers[action.key]?.status === 'completed'
                        ? faCheck
                        : faClock
                    }
                    size={10}
                    color={
                      restTimers[action.key]?.status === 'ready' ||
                      restTimers[action.key]?.status === 'completed'
                        ? '#2D7B46'
                        : config.color
                    }
                  />
                  <Text style={[styles.timerButtonText, { color: config.color }]}>
                    {timerLabel(action)}
                  </Text>
                </Pressable>
              ) : null}
              {action.state === 'planned' &&
              !reminders[action.key] &&
              !restTimers[action.key] ? (
                <Text style={[styles.plannedLabel, { color: config.color }]}>
                  {t('today.planned')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.planSection}>
        <View style={styles.headingRow}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('today.todays_plan')}
          </Text>
          <Text
            style={[
              styles.progressCount,
              {
                color: theme.colors.orange700,
                backgroundColor: theme.colors.orange50,
              },
            ]}
          >
            {t('today.completed_of_total', {
              completed: completedCount,
              total: visiblePrimaryActions.length,
            })}
          </Text>
        </View>

        <View style={styles.planOverview}>
          <View style={styles.progressTrack}>
            <View
              accessibilityLabel={t('today.plan_progress_label', {
                completed: completedCount,
                total: visiblePrimaryActions.length,
              })}
              style={[
                styles.progressFill,
                {
                  width: `${
                    visiblePrimaryActions.length > 0
                      ? (completedCount / visiblePrimaryActions.length) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <FontAwesomeIcon
                icon={hasDailyWin ? faCheck : faHeart}
                size={12}
                color={theme.colors.orange700}
              />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>
                {t(
                  hasDailyWin ? 'today.daily_win' : 'today.your_plan_is_ready',
                )}
              </Text>
              {!hasDailyWin ? (
                <Text style={styles.statusDetail}>
                  {plannedCount > 0
                    ? t('today.planned_actions_ready', {
                        count: plannedCount,
                      })
                    : t('today.complete_one_for_win')}
                </Text>
              ) : null}
            </View>
            {hasAppliedRiskImpact ? (
              <Text style={styles.progressValue}>
                {t('today.risk_impact_applied', {
                  value: formatRiskImpact(completedRiskImpact),
                })}
              </Text>
            ) : null}
          </View>
          {sharedPlanContexts.length > 0 ? (
            <View style={styles.focusRow}>
              <Text style={styles.focusLabel}>{t('today.plan_focus')}</Text>
              <Text style={styles.focusText}>
                {sharedPlanContexts.join(' · ')}
              </Text>
            </View>
          ) : null}
          <View style={styles.rhythmRow}>
            <View style={styles.rhythmCopy}>
              <FontAwesomeIcon
                icon={streakProgress.freezeUsed ? faSnowflake : faCalendarCheck}
                size={11}
                color={
                  streakProgress.freezeUsed ? '#4C79A8' : theme.colors.orange600
                }
              />
              <Text style={styles.rhythmText}>
                {streakProgress.days > 0
                  ? t('today.current_streak', {
                      count: streakProgress.days,
                    })
                  : t('today.rhythm_starts_here')}
                {streakProgress.freezeUsed
                  ? ` · ${t('today.freeze_protected')}`
                  : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.groups}>
          {groupedActions.map(({ domain, actions }, groupIndex) => {
            const config = DOMAIN_CONFIG[domain];
            return (
              <View
                key={domain}
                style={[
                  styles.domainSection,
                  groupIndex > 0 && styles.domainSectionSpaced,
                ]}
              >
                <View
                  style={[
                    styles.domainHeader,
                    {
                      backgroundColor: config.background,
                      borderLeftColor: config.color,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.domainIcon,
                      {
                        backgroundColor: config.iconBackground,
                      },
                    ]}
                  >
                    <DomainIcon domain={domain} size={14} />
                  </View>
                  <Text style={[styles.domainName, { color: config.color }]}>
                    {t(`today.domain_${domain}`)}
                  </Text>
                </View>

                {actions.map((action, index) => renderActionRow(action, index))}
              </View>
            );
          })}
          {INLINE_ADDITIONAL_ACTIONS_ENABLED &&
          groupedAdditionalActions.length > 0 ? (
            <>
              <Text style={styles.sectionSubheading}>
                {t('today.additional_actions')}
              </Text>
              {groupedAdditionalActions.map(
                ({ domain, actions }, groupIndex) => {
                  const config = DOMAIN_CONFIG[domain];
                  return (
                    <View
                      key={`additional:${domain}`}
                      style={[
                        styles.domainSection,
                        groupIndex > 0 && styles.domainSectionSpaced,
                      ]}
                    >
                      <View
                        style={[
                          styles.domainHeader,
                          {
                            backgroundColor: config.background,
                            borderLeftColor: config.color,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.domainIcon,
                            {
                              backgroundColor: config.iconBackground,
                            },
                          ]}
                        >
                          <DomainIcon domain={domain} size={14} />
                        </View>
                        <Text
                          style={[styles.domainName, { color: config.color }]}
                        >
                          {t(`today.domain_${domain}`)}
                        </Text>
                      </View>
                      {actions.map((action, index) =>
                        renderActionRow(action, index),
                      )}
                    </View>
                  );
                },
              )}
            </>
          ) : null}
          {/* Service/treatment escalation is disabled for the current release.
              Keep support action rendering here so it is easy to restore. */}
          {/* {experience.supportActions.length > 0 ? (
            <>
              <Text style={styles.sectionSubheading}>
                {t('today.support_actions')}
              </Text>
              {experience.supportActions.map((action, index) =>
                renderActionRow(action, index, false),
              )}
            </>
          ) : null} */}
        </View>
      </View>

      <ReminderTimePicker
        visible={reminderAction !== null}
        onClose={() => setReminderAction(null)}
        onConfirm={handleReminderConfirm}
        onRemove={
          reminderAction && reminders[reminderAction.key]
            ? removeReminder
            : undefined
        }
        initialHour={
          reminderAction ? reminders[reminderAction.key]?.hour : undefined
        }
        initialMinute={
          reminderAction ? reminders[reminderAction.key]?.minute : undefined
        }
        taskTitle={reminderAction?.title}
      />

      <Modal
        visible={dailyWinVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseDailyWin}
      >
        <View
          accessibilityViewIsModal
          accessibilityLabel={t('today.daily_win_modal_title')}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalIllustration}>
              <SvgXml xml={CONGRATS_SVG} width={150} height={150} />
            </View>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              {t('today.daily_win_modal_title')}
            </Text>
            <Text style={styles.modalBody}>
              {t('today.daily_win_modal_body')}
            </Text>
            <View style={styles.modalButton}>
              <Button
                title={t('today.daily_win_continue')}
                onPress={onCloseDailyWin}
              />
            </View>
            {onOpenWeeklySummary ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onCloseDailyWin();
                  onOpenWeeklySummary();
                }}
                style={styles.weeklyButton}
              >
                <Text style={styles.weeklyButtonText}>
                  {t('today.view_weekly_summary')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};
