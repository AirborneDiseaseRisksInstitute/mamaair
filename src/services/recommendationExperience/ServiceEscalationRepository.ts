import { resolveRecommendationCapabilityStatus } from '../../config/recommendationExperience';
import type {
  ServiceEscalationSignal,
  ServiceEscalationUrgency,
} from '../../types/recommendationExperience';
import type {
  SummaryRecommendation,
  SummaryResponse,
} from '../api/SummaryService';

const urgencyFromBackend = (
  value: string,
): ServiceEscalationUrgency | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'routine' || normalized === 'low') {
    return 'routine';
  }
  if (normalized === 'prompt' || normalized === 'medium') {
    return 'prompt';
  }
  if (normalized === 'urgent' || normalized === 'high') {
    return 'urgent';
  }
  if (
    normalized === 'emergency' ||
    normalized === 'critical'
  ) {
    return 'emergency';
  }
  return null;
};

const isServiceRecommendation = (
  recommendation: SummaryRecommendation,
): boolean =>
  ['service', 'treatment', 'referral'].includes(
    recommendation.category.trim().toLowerCase(),
  );

/**
 * Consumes only explicit backend service signals. It never derives urgency
 * from symptoms, exposure values, or locally reviewed content.
 */
export const getServiceEscalationSignals = (
  summary: SummaryResponse | null,
): ServiceEscalationSignal[] => {
  if (
    resolveRecommendationCapabilityStatus('serviceEscalation') !==
    'available'
  ) {
    return [];
  }

  return (summary?.recommendations ?? [])
    .filter(isServiceRecommendation)
    .map(recommendation => {
      const urgency = urgencyFromBackend(
        recommendation.severity,
      );
      if (!urgency) return null;
      return {
        sourceId: recommendation.id,
        urgency,
        title: recommendation.title,
        guidance:
          recommendation.message || recommendation.alert,
        acknowledgementRequired:
          urgency === 'urgent' || urgency === 'emergency',
      } satisfies ServiceEscalationSignal;
    })
    .filter(
      (signal): signal is ServiceEscalationSignal =>
        signal !== null,
    );
};
