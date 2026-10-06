import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';
import {
  SummaryService,
  type SummaryResponse,
} from '../services/api/SummaryService';
import { backgroundSync } from '../services/sync/BackgroundSync';
import { locationAccessCoordinator } from '../services/tracking/LocationAccessCoordinator';
import { classifyApiFailure, type ApiFailure } from '../utils/apiErrors';
import { recordedDistanceMeters } from '../utils/movementSummary';
import { DEV_LOCAL_SESSION } from '../config/dev';

interface MovementReading {
  scope: string;
  distanceMeters: number | null;
  fetchedAt: number | null;
  loading: boolean;
  failure: ApiFailure | null;
}

const emptyReading = (scope: string): MovementReading => ({
  scope,
  distanceMeters: null,
  fetchedAt: null,
  loading: false,
  failure: null,
});

export const useTodayMovement = (date: string, owner: string) => {
  const scope = `${owner}:${date}`;
  const [reading, setReading] = useState(() => emptyReading(scope));
  const [trackingActive, setTrackingActive] = useState(() =>
    locationAccessCoordinator.isTracking(),
  );
  const requestVersion = useRef(0);

  // Today shares its existing /summary/ response with this card. Only explicit
  // refreshes and completed movement uploads need an additional summary read.
  const beginLoad = useCallback(() => {
    const version = ++requestVersion.current;
    setReading(current => ({
      ...(current.scope === scope ? current : emptyReading(scope)),
      loading: true,
    }));
    return (summary: SummaryResponse | null, failure: ApiFailure | null) => {
      if (version !== requestVersion.current) return;
      setReading(current => {
        const previous =
          current.scope === scope ? current : emptyReading(scope);
        return failure
          ? { ...previous, loading: false, failure }
          : {
              scope,
              distanceMeters: recordedDistanceMeters(summary),
              fetchedAt: Date.now(),
              loading: false,
              failure: null,
            };
      });
    };
  }, [scope]);

  const refresh = useCallback(async () => {
    if (DEV_LOCAL_SESSION) return;
    const complete = beginLoad();
    try {
      complete(await SummaryService.getSummary(), null);
    } catch (error) {
      complete(null, classifyApiFailure(error));
    }
  }, [beginLoad]);

  useFocusEffect(
    useCallback(() => {
      setTrackingActive(locationAccessCoordinator.isTracking());
      const stopTracking =
        locationAccessCoordinator.addTrackingStateListener(setTrackingActive);
      const stopUploads = backgroundSync.addUploadListener(() => {
        if (AppState.currentState === 'active') refresh();
      });
      const appState = AppState.addEventListener('change', state => {
        if (state === 'active') {
          setTrackingActive(locationAccessCoordinator.isTracking());
          refresh();
        }
      });
      return () => {
        requestVersion.current += 1;
        stopTracking();
        stopUploads();
        appState.remove();
      };
    }, [refresh]),
  );

  return {
    reading: reading.scope === scope ? reading : emptyReading(scope),
    trackingActive,
    beginLoad,
    refresh,
  };
};
