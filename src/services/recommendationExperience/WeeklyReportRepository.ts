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

const dateRange = (summary: WeeklySummaryExperience): string =>
  `${summary.startDate} to ${summary.endDate}`;

const formatPercent = (value: number): string =>
  `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

const riskSummaryText = (summary: WeeklySummaryExperience): string | null => {
  const riskSummary = summary.riskSummary;
  if (!riskSummary) return null;
  const viewModel = buildWeeklyRiskSummaryViewModel(riskSummary);
  const changeLines = viewModel.changes.map(change => {
    const label = change.audience === 'mother' ? 'Mother' : 'Child';
    const changeText =
      change.direction === 'stable'
        ? 'no change'
        : `${formatPercent(change.value)} ${change.direction}`;
    return `${label} estimate: ${changeText}`;
  });
  const careLine =
    viewModel.completedCareReduction !== null
      ? `Completed care actions were linked to an estimated ${formatPercent(
          viewModel.completedCareReduction,
        )} reduction.`
      : viewModel.hasCompletedCareImpact
      ? 'Completed care actions were included in this estimate.'
      : null;
  const factorLine =
    changeLines.length === 0 &&
    careLine === null &&
    viewModel.trackedFactorCount > 0
      ? `${viewModel.trackedFactorCount} environmental health ${
          viewModel.trackedFactorCount === 1 ? 'factor was' : 'factors were'
        } identified in the latest reading.`
      : null;
  const lines = [...changeLines, careLine, factorLine].filter(
    (line): line is string => Boolean(line),
  );

  return lines.length > 0 ? lines.join('\n') : null;
};

export const buildWeeklyReport = (
  summary: WeeklySummaryExperience,
): WeeklyReportModel => {
  const progression = resolvePregnancyProgression(summary.week);
  const earnedBadges = getWeeklyBadges(summary)
    .filter(badge => badge.earned)
    .map(badge => badge.domain);
  const badgeText = earnedBadges.length
    ? earnedBadges
        .map(
          domain =>
            domain.charAt(0).toUpperCase() + domain.slice(1),
        )
        .join(', ')
    : 'A steady start';
  const environmentalHealthSummary = riskSummaryText(summary);
  const optionalLines = [
    environmentalHealthSummary
      ? `Environmental health\n${environmentalHealthSummary}\nEstimates reflect environmental exposure and are not a medical diagnosis.`
      : null,
    summary.symptomTrend
      ? `Feeling pattern statistics: ${summary.symptomTrend}`
      : null,
  ].filter((line): line is string => line !== null);
  const shareText = [
    `MamaAir weekly report — pregnancy week ${summary.week}`,
    progression.chapterLabel,
    `Active care days: ${summary.activeDays} of 7`,
    `Completed protective actions: ${summary.primaryCompleted}`,
    `Hydration goal days: ${summary.hydrationDays} of 7`,
    `Rest sessions: ${summary.restSessions}`,
    `Sleep check-ins: ${summary.sleepNights}`,
    `Achievements: ${badgeText}`,
    ...optionalLines,
  ].join('\n');

  return {
    weekKey: getWeekKey(summary.endDate),
    pregnancyWeek: summary.week,
    trimesterLabel: progression.chapterLabel,
    dateRange: dateRange(summary),
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
): Promise<WeeklyShareRecord> => {
  const initiatedAt = new Date().toISOString();
  ProductAnalytics.track(identity, 'share_initiated', {
    pregnancyWeek: report.pregnancyWeek,
  });
  const result = await Share.share({
    title: `MamaAir week ${report.pregnancyWeek} report`,
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
