import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ExposureTrendPoint } from '../../types/recommendationExperience';
import { radius, spacing, useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

interface ExposureTrendViewProps {
  points: ExposureTrendPoint[];
}

const pointValue = (point: ExposureTrendPoint): number =>
  point.integratedScore ??
  point.aqi ??
  point.pm25 ??
  0;

export const ExposureTrendView: React.FC<
  ExposureTrendViewProps
> = ({ points }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'fr'
    ? 'fr-FR'
    : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';
  const visiblePoints = points.slice(-7);
  const max = Math.max(
    1,
    ...visiblePoints.map(pointValue),
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing('md'),
          padding: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: '#FFF8F2',
        },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 14,
        },
        description: {
          marginTop: 3,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 17,
        },
        chart: {
          height: 96,
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginTop: spacing('md'),
          gap: 7,
        },
        day: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-end',
        },
        track: {
          width: '100%',
          maxWidth: 28,
          height: 70,
          justifyContent: 'flex-end',
          overflow: 'hidden',
          borderRadius: 9,
          backgroundColor: '#F1E7E0',
        },
        fill: {
          width: '100%',
          minHeight: 5,
          borderRadius: 9,
          backgroundColor: theme.colors.orange500,
        },
        label: {
          marginTop: 5,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 9,
        },
        empty: {
          marginTop: spacing('md'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 12,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('trend.recent_exposure')}
      </Text>
      <Text style={styles.description}>
        {t('trend.relative_description')}
      </Text>
      {visiblePoints.length ? (
        <View style={styles.chart}>
          {visiblePoints.map(point => {
            const value = pointValue(point);
            const height = Math.max(
              7,
              Math.round((value / max) * 70),
            );
            const label = new Date(
              `${point.date}T00:00:00`,
            ).toLocaleDateString(locale, {
              weekday: 'short',
            });
            return (
              <View key={point.date} style={styles.day}>
                <View style={styles.track}>
                  <View
                    accessibilityLabel={t('trend.relative_value', {
                      day: label,
                      value,
                    })}
                    style={[styles.fill, { height }]}
                  />
                </View>
                <Text style={styles.label}>{label}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.empty}>
          {t('trend.empty')}
        </Text>
      )}
    </View>
  );
};
