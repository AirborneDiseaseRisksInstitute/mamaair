import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faLocationDot,
  faRotateRight,
  faRoute,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { radius, spacing, useTheme } from '../../theme';
import type { ApiFailure, ApiFailureKind } from '../../utils/apiErrors';
import { formatMovementDistance } from '../../utils/movementSummary';

interface TodayMovementCardProps {
  distanceMeters: number | null;
  fetchedAt: number | null;
  loading: boolean;
  failure: ApiFailure | null;
  trackingActive: boolean;
  onRefresh: () => void;
  onEnableTracking: () => void;
}

const FAILURE_KEYS: Record<ApiFailureKind, string> = {
  network: 'today.update_reason_network',
  timeout: 'today.update_reason_timeout',
  authentication: 'today.update_reason_authentication',
  permission: 'today.update_reason_permission',
  notFound: 'today.update_reason_not_found',
  validation: 'today.update_reason_validation',
  rateLimit: 'today.update_reason_rate_limit',
  server: 'today.update_reason_server',
  unknown: 'today.update_reason_unknown',
};

export const TodayMovementCard: React.FC<TodayMovementCardProps> = ({
  distanceMeters,
  fetchedAt,
  loading,
  failure,
  trackingActive,
  onRefresh,
  onEnableTracking,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || 'en';
  const distance =
    distanceMeters === null
      ? null
      : formatMovementDistance(distanceMeters, locale);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginTop: spacing('md'),
          paddingHorizontal: spacing('md'),
          paddingVertical: spacing('sm'),
          borderRadius: radius('lg'),
          borderWidth: 1,
          borderColor: theme.colors.orange100,
          backgroundColor: theme.colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing('xs'),
        },
        icon: {
          width: 30,
          height: 30,
          borderRadius: 10,
          backgroundColor: theme.colors.orange50,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          flex: 1,
          fontSize: 14,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
        },
        value: {
          fontSize: 21,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
        },
        unit: {
          fontSize: 12,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
        },
        refresh: {
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        details: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: spacing('sm'),
        },
        caption: {
          fontSize: 11,
          lineHeight: 16,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
        },
        status: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          minHeight: 28,
        },
        statusText: {
          fontSize: 11,
          lineHeight: 16,
          color: theme.colors.orange800,
          fontFamily: theme.typography.fontFamily.medium,
        },
        accessMessage: {
          flex: 1,
          fontSize: 11,
          lineHeight: 16,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
        },
        accessAction: {
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: spacing('xs'),
        },
        accessActionText: {
          fontSize: 12,
          color: theme.colors.orange800,
          fontFamily: theme.typography.fontFamily.bold,
        },
        note: {
          marginTop: spacing('xs'),
          fontSize: 11,
          lineHeight: 16,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
        },
        error: { marginTop: spacing('xs') },
      }),
    [theme],
  );

  return (
    <View style={styles.card} testID="today-movement-card">
      <View style={styles.header}>
        <View style={styles.icon}>
          <FontAwesomeIcon
            icon={faRoute}
            size={14}
            color={theme.colors.orange700}
          />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {t('movement.title')}
        </Text>
        <Text
          style={styles.value}
          accessibilityLabel={
            distance
              ? `${t('movement.recorded_distance')}: ${distance.value} ${t(
                  `movement.unit_${distance.unit}`,
                )}`
              : `${t('movement.recorded_distance')}: —`
          }
          accessibilityHint={distance ? t('movement.distance_note') : undefined}
        >
          {distance ? distance.value : '—'}
          {distance ? (
            <Text style={styles.unit}>
              {' '}
              {t(`movement.unit_${distance.unit}`)}
            </Text>
          ) : null}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('movement.refresh')}
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          onPress={onRefresh}
          style={styles.refresh}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.orange700} />
          ) : (
            <FontAwesomeIcon
              icon={faRotateRight}
              size={15}
              color={theme.colors.orange700}
            />
          )}
        </Pressable>
      </View>

      <View style={styles.details}>
        {trackingActive ? (
          <View style={styles.status}>
            <FontAwesomeIcon
              icon={faLocationDot}
              size={11}
              color={theme.colors.orange700}
            />
            <Text style={styles.statusText}>{t('movement.tracking_on')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.accessMessage}>
              {t('movement.access_needed')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('movement.allow_access')}
              onPress={onEnableTracking}
              style={styles.accessAction}
              testID="today-movement-allow-access"
            >
              <Text style={styles.accessActionText}>
                {t('movement.allow_access')}
              </Text>
            </Pressable>
          </>
        )}
        {fetchedAt !== null ? (
          <Text style={styles.caption}>
            ·{' '}
            {t('movement.checked_at', {
              time: new Date(fetchedAt).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
              }),
            })}
          </Text>
        ) : null}
      </View>

      {!distance && (trackingActive || loading || failure) ? (
        <Text style={styles.note}>
          {t(
            loading
              ? 'movement.loading'
              : failure
              ? 'movement.unavailable'
              : trackingActive
              ? 'movement.empty_active'
              : 'movement.empty_paused',
          )}
        </Text>
      ) : null}
      {failure ? (
        <View accessibilityRole="alert" style={styles.error}>
          <Text style={styles.caption}>
            {distance ? `${t('movement.stale')} ` : ''}
            {t(FAILURE_KEYS[failure.kind])}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
