import { resolveRecommendationCapabilityStatus } from '../../config/recommendationExperience';
import type {
  CapabilityStatus,
  ExposureTrendPoint,
} from '../../types/recommendationExperience';
import { ExposureService, type AirExposure } from '../api/ExposureService';
import type { SummaryResponse } from '../api/SummaryService';

export interface ExposureTrendExperience {
  points: ExposureTrendPoint[];
  status: CapabilityStatus;
  source: 'history' | 'summary' | 'reference' | 'none';
}

const normalizeHistory = (value: unknown): ExposureTrendPoint[] => {
  const body = value as { items?: unknown[] } | unknown[] | null | undefined;
  const items = Array.isArray(body) ? body : body?.items ?? [];

  return items
    .reduce<ExposureTrendPoint[]>((points, item) => {
      const record = item as Partial<AirExposure> & {
        date?: string;
        integrated_score?: number;
      };
      const date = record.date ?? record.timestamp?.slice(0, 10);
      if (!date) return points;
      const point: ExposureTrendPoint = {
        date,
        integratedScore: record.integrated_score,
        aqi: record.aqi,
        pm25: record.pm25,
        temperature: record.temperature,
        humidity: record.humidity,
        uvi: record.uvi,
      };
      const hasValue = [
        point.integratedScore,
        point.aqi,
        point.pm25,
        point.temperature,
        point.humidity,
        point.uvi,
      ].some(metric => typeof metric === 'number' && Number.isFinite(metric));
      if (hasValue) points.push(point);
      return points;
    }, [])
    .sort((left, right) => left.date.localeCompare(right.date));
};

const summaryHistory = (
  summary: SummaryResponse | null,
): ExposureTrendPoint[] =>
  (summary?.exposure_history?.items ?? [])
    .filter(
      item => Boolean(item.date) && Number.isFinite(item.integrated_score),
    )
    .map(item => ({
      date: item.date,
      integratedScore: item.integrated_score,
    }));

export const loadExposureTrend = async ({
  summary,
  endDate: _endDate,
  pregnancyWeek: _pregnancyWeek,
}: {
  summary: SummaryResponse | null;
  endDate: string;
  pregnancyWeek: number;
}): Promise<ExposureTrendExperience> => {
  const explicitStatus =
    resolveRecommendationCapabilityStatus('exposureHistory');
  if (explicitStatus === 'available') {
    try {
      const points = normalizeHistory(
        await ExposureService.getExposureHistory(7),
      );
      if (points.length) {
        return {
          points,
          status: 'available',
          source: 'history',
        };
      }
      const pointsFromSummary = summaryHistory(summary);
      return {
        points: pointsFromSummary,
        status: 'available',
        // Reference trajectories never substitute for recorded exposure
        // history when backend or summary data is unavailable.
        source: pointsFromSummary.length ? 'summary' : 'none',
      };
    } catch {
      const points = summaryHistory(summary);
      return {
        points,
        status: 'unavailable',
        // Do not substitute reference trajectory values in Today.
        source: points.length ? 'summary' : 'none',
      };
    }
  }

  const points = summaryHistory(summary);
  if (points.length) {
    return {
      points,
      status: explicitStatus,
      source: 'summary',
    };
  }

  return {
    // Today displays only recorded exposure history.
    points: [],
    status: explicitStatus,
    source: 'none',
  };
};
