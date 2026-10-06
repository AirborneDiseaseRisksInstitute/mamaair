import { Share } from 'react-native';
import {
  RECOMMENDATION_CAPABILITIES,
} from '../../config/recommendationExperience';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import type {
  RecommendationExperienceIdentity,
  WeeklyReportModel,
  WeeklyShareRecord,
  WeeklySummaryExperience,
} from '../../types/recommendationExperience';
import { getWeekKey, getWeeklyBadges, resolvePregnancyProgression } from './ProgressionRepository';
import { ProductAnalytics } from './ProductAnalytics';
import { buildWeeklyRiskSummaryViewModel } from './WeeklyRiskSummaryPresenter';

type Translate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

const translated = (
  translate: Translate | undefined,
  key: string,
  fallback: string,
  options?: Record<string, unknown>,
): string => translate?.(key, options) ?? fallback;

export interface WeeklyReportEntitlement {
  status: 'nativeShareAvailable';
  configuredStatus:
    | 'available'
    | 'notImplemented';
}

export const getWeeklyReportEntitlement =
  (): WeeklyReportEntitlement => ({
    status: 'nativeShareAvailable',
    configuredStatus:
      RECOMMENDATION_CAPABILITIES.weeklyReportEntitlement,
  });

const dateRange = (
  summary: WeeklySummaryExperience,
  translate?: Translate,
): string => translated(
  translate,
  'weekly_summary.report_date_range',
  `${summary.startDate} to ${summary.endDate}`,
  { start: summary.startDate, end: summary.endDate },
);

const formatPercent = (value: number): string =>
  `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

const riskSummaryText = (
  summary: WeeklySummaryExperience,
  translate?: Translate,
): string | null => {
  const riskSummary = summary.riskSummary;
  if (!riskSummary) return null;
  const viewModel = buildWeeklyRiskSummaryViewModel(riskSummary);
  const changeLines = viewModel.changes.map(change => {
    const label = translated(
      translate,
      change.audience === 'mother'
        ? 'weekly_summary.risk_mother'
        : 'weekly_summary.risk_child',
      change.audience === 'mother' ? 'Mother' : 'Child',
    );
    const changeText =
      change.direction === 'stable'
        ? translated(translate, 'weekly_summary.risk_change_stable', 'No change')
        : translated(
            translate,
            change.direction === 'lower'
              ? 'weekly_summary.risk_change_lower'
              : 'weekly_summary.risk_change_higher',
            `${formatPercent(change.value)} ${change.direction}`,
            { value: formatPercent(change.value) },
          );
    return translated(translate, 'weekly_summary.report_risk_estimate', `${label} estimate: ${changeText}`, {
      audience: label,
      change: changeText,
    });
  });
  const careLine =
    viewModel.completedCareReduction !== null
      ? translated(translate, 'weekly_summary.risk_care_reduction', `Completed care actions were linked to an estimated ${formatPercent(viewModel.completedCareReduction)} reduction.`, {
          value: Number.isInteger(viewModel.completedCareReduction)
            ? viewModel.completedCareReduction
            : viewModel.completedCareReduction.toFixed(1),
        })
      : viewModel.hasCompletedCareImpact
      ? translated(translate, 'weekly_summary.risk_care_included', 'Completed care actions were included in this estimate.')
      : null;
  const factorLine =
    changeLines.length === 0 &&
    careLine === null &&
    viewModel.trackedFactorCount > 0
      ? translated(translate, 'weekly_summary.risk_factors_included', `${viewModel.trackedFactorCount} environmental health ${viewModel.trackedFactorCount === 1 ? 'factor was' : 'factors were'} identified in the latest reading.`, {
          count: viewModel.trackedFactorCount,
        })
      : null;
  const lines = [...changeLines, careLine, factorLine].filter(
    (line): line is string => Boolean(line),
  );

  return lines.length > 0 ? lines.join('\n') : null;
};

export const buildWeeklyReport = (
  summary: WeeklySummaryExperience,
  translate?: Translate,
): WeeklyReportModel => {
  const progression = resolvePregnancyProgression(summary.week);
  const earnedBadges = getWeeklyBadges(summary)
    .filter(badge => badge.earned)
    .map(badge => badge.domain);
  const badgeText = earnedBadges.length
    ? earnedBadges
        .map(domain => translated(
          translate,
          `today.domain_${domain}`,
          domain.charAt(0).toUpperCase() + domain.slice(1),
        ))
        .join(', ')
    : translated(translate, 'weekly_summary.report_steady_start', 'A steady start');
  const environmentalHealthSummary = riskSummaryText(summary, translate);
  const optionalLines = [
    environmentalHealthSummary
      ? translated(translate, 'weekly_summary.report_environmental_section', `Environmental health\n${environmentalHealthSummary}\nEstimates reflect environmental exposure and are not a medical diagnosis.`, {
          summary: environmentalHealthSummary,
          disclaimer: translated(translate, 'weekly_summary.risk_disclaimer', 'Estimates reflect environmental exposure and are not a medical diagnosis.'),
        })
      : null,
    summary.symptomTrend
      ? translated(translate, 'weekly_summary.report_feeling_statistics', `Feeling pattern statistics: ${summary.symptomTrend}`, {
          trend: summary.symptomTrend,
        })
      : null,
  ].filter((line): line is string => line !== null);
  const shareText = [
    translated(translate, 'weekly_summary.report_heading', `MamaAir weekly report — pregnancy week ${summary.week}`, { week: summary.week }),
    translated(translate, 'home.trimester_label', progression.chapterLabel, { number: progression.trimester }),
    translated(translate, 'weekly_summary.report_active_days', `Active care days: ${summary.activeDays} of 7`, { count: summary.activeDays }),
    translated(translate, 'weekly_summary.report_completed_actions', `Completed protective actions: ${summary.primaryCompleted}`, { count: summary.primaryCompleted }),
    translated(translate, 'weekly_summary.report_hydration_days', `Hydration goal days: ${summary.hydrationDays} of 7`, { count: summary.hydrationDays }),
    translated(translate, 'weekly_summary.report_rest_sessions', `Rest sessions: ${summary.restSessions}`, { count: summary.restSessions }),
    translated(translate, 'weekly_summary.report_sleep_checkins', `Sleep check-ins: ${summary.sleepNights}`, { count: summary.sleepNights }),
    translated(translate, 'weekly_summary.report_achievements', `Achievements: ${badgeText}`, { achievements: badgeText }),
    ...optionalLines,
  ].join('\n');

  return {
    weekKey: getWeekKey(summary.endDate),
    pregnancyWeek: summary.week,
    trimesterLabel: translated(translate, 'home.trimester_label', progression.chapterLabel, {
      number: progression.trimester,
    }),
    dateRange: dateRange(summary, translate),
    motherRecap: environmentalHealthSummary ?? '',
    babyRecap: summary.babyProgress,
    symptomTrend: summary.symptomTrend,
    participation: {
      activeDays: summary.activeDays,
      primaryCompleted: summary.primaryCompleted,
      hydrationDays: summary.hydrationDays,
      restSessions: summary.restSessions,
      sleepNights: summary.sleepNights,
    },
    earnedBadges,
    shareText,
  };
};

export const shareWeeklyReport = async (
  identity: RecommendationExperienceIdentity,
  report: WeeklyReportModel,
  translate?: Translate,
): Promise<WeeklyShareRecord> => {
  const initiatedAt = new Date().toISOString();
  ProductAnalytics.track(identity, 'share_initiated', {
    pregnancyWeek: report.pregnancyWeek,
  });
  const result = await Share.share({
    title: translated(translate, 'weekly_summary.report_share_title', `MamaAir week ${report.pregnancyWeek} report`, {
      week: report.pregnancyWeek,
    }),
    message: report.shareText,
  });
  const record: WeeklyShareRecord = {
    weekKey: report.weekKey,
    pregnancyWeek: report.pregnancyWeek,
    initiatedAt,
    completedAt:
      result.action === Share.sharedAction
        ? new Date().toISOString()
        : undefined,
  };
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);
  useRecommendationExperienceStore
    .getState()
    .saveShareRecord(record);
  if (record.completedAt) {
    ProductAnalytics.track(identity, 'share_completed', {
      pregnancyWeek: report.pregnancyWeek,
    });
  }
  return record;
};
