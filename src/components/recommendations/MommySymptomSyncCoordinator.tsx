import React, { useCallback, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { DEV_LOCAL_SESSION } from '../../config/dev';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import {
  hasInternetConnection,
  syncPendingMommySymptomSelections,
} from '../../services/recommendationExperience/MommySymptomSyncService';
import { useToast } from '../ui';

export const MommySymptomSyncCoordinator: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const token = useAuthStore(state => state.token);
  const backendUserId = useUserStore(state => state.profile.backendUserId);
  const email = useUserStore(state => state.profile.email);
  const pendingCount = useRecommendationExperienceStore(
    state => Object.keys(state.pendingMommySymptomSelections).length,
  );
  const syncing = useRef(false);

  useEffect(() => {
    useRecommendationExperienceStore
      .getState()
      .ensureOwner({ backendUserId, email });
  }, [backendUserId, email]);

  const syncPending = useCallback(async () => {
    if (syncing.current || !token || DEV_LOCAL_SESSION) return;
    if (
      Object.keys(
        useRecommendationExperienceStore.getState()
          .pendingMommySymptomSelections,
      ).length === 0
    ) {
      return;
    }

    syncing.current = true;
    try {
      const result = await syncPendingMommySymptomSelections();
      if (result.syncedDates.length > 0) {
        showToast({
          type: 'success',
          title: t('feeling_checkin.sync_complete_title'),
          message: t('feeling_checkin.sync_complete_message'),
          duration: 3500,
        });
      }
      if (result.failures.length > 0) {
        showToast({
          type: 'error',
          title: t('feeling_checkin.sync_failed_title'),
          message: t('feeling_checkin.sync_failed_message'),
        });
      }
    } finally {
      syncing.current = false;
    }
  }, [showToast, t, token]);

  useEffect(() => {
    if (!token || DEV_LOCAL_SESSION) return undefined;
    return NetInfo.addEventListener(state => {
      if (hasInternetConnection(state)) {
        syncPending().catch(() => {});
      }
    });
  }, [syncPending, token]);

  useEffect(() => {
    if (pendingCount === 0 || !token || DEV_LOCAL_SESSION) return;
    NetInfo.fetch()
      .then(state => {
        if (hasInternetConnection(state)) {
          syncPending().catch(() => {});
        }
      })
      .catch(() => {});
  }, [pendingCount, syncPending, token]);

  return null;
};
