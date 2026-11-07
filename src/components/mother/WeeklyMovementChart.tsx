import React, { useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPersonWalking } from '@fortawesome/free-solid-svg-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
import { spacing, useTheme } from '../../theme';
import type { WeeklyMovementSummary } from '../../services/tracking/MovementHistoryRepository';
import { formatMovementDistance } from '../../utils/movementSummary';

const Y_AXIS_WIDTH = 32;
const POINT_RADIUS = 3;

interface WeeklyMovementChartProps {
  summary: WeeklyMovementSummary;
  weekDates: string[];
  currentDate: string;
  locale: string;
}

const formatWeekday = (date: string, locale: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
  });

const plotWidth = (viewportWidth: number): number =>
  Math.max(1, viewportWidth - Y_AXIS_WIDTH - POINT_RADIUS);

const chartSpacing = (viewportWidth: number) => {
  const spacingValue = plotWidth(viewportWidth) / 7;
  return {
    initialSpacing: spacingValue / 2,
    spacing: spacingValue,
  };
};

export const WeeklyMovementChart: React.FC<WeeklyMovementChartProps> = ({
  summary,
  weekDates,
  currentDate,
  locale,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [viewportWidth, setViewportWidth] = useState(0);
  const today = summary.days.find(day => day.date === currentDate);
  const todayDistance =
    today?.distanceMeters === null || today?.distanceMeters === undefined
      ? null
      : formatMovementDistance(today.distanceMeters, locale);
  const weekDistance =
    summary.recordedDays === 0
      ? null
      : formatMovementDistance(summary.totalDistanceMeters, locale);
  const chartData = useMemo(
    () =>
      weekDates.map(date => {
        const day = summary.days.find(item => item.date === date);
        return {
          value:
            day?.distanceMeters === null || day?.distanceMeters === undefined
              ? undefined
              : day.distanceMeters / 1000,
        };
      }),
    [summary.days, weekDates],
  );
  const maxValue = useMemo(() => {
    const highest = Math.max(0, ...chartData.map(point => point.value ?? 0));
    return Math.max(0.1, Math.ceil(highest * 1.15 * 10) / 10);
  }, [chartData]);

  const onLayout = (event: LayoutChangeEvent): void => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== viewportWidth) {
      setViewportWidth(nextWidth);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: spacing('md'),
          marginHorizontal: spacing('md'),
          marginTop: spacing('md'),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing('xs'),
        },
        icon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          backgroundColor: theme.surfaceColor('#EAF6F2'),
        },
        title: {
          flex: 1,
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
        },
        description: {
          fontSize: 13,
          lineHeight: 19,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          marginBottom: spacing('md'),
        },
        summaryRow: {
          flexDirection: 'row',
          gap: spacing('sm'),
          marginBottom: spacing('md'),
        },
        summaryItem: {
          flex: 1,
          borderRadius: 12,
          padding: spacing('sm'),
          backgroundColor: theme.surfaceColor('#FFF8F2'),
        },
        summaryValue: {
          fontSize: 18,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.orange600,
        },
        summaryLabel: {
          marginTop: 2,
          fontSize: 11,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
        },
        chartTitle: {
          fontSize: 12,
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.textSecondary,
          marginBottom: spacing('sm'),
        },
        viewport: {
          width: '100%',
          overflow: 'hidden',
        },
        axisText: {
          color: theme.colors.textSecondary,
          fontSize: 10,
        },
        xAxisRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginLeft: Y_AXIS_WIDTH,
          paddingHorizontal: 2,
          marginBottom: spacing('sm'),
        },
        xAxisLabel: {
          flex: 1,
          textAlign: 'center',
          fontSize: 11,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
        },
        empty: {
          minHeight: 130,
          borderRadius: 12,
          backgroundColor: theme.colors.neutral100,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing('lg'),
          marginBottom: spacing('sm'),
        },
        emptyText: {
          textAlign: 'center',
          fontSize: 12,
          lineHeight: 18,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
        },
        note: {
          fontSize: 11,
          lineHeight: 17,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.card} testID="weekly-movement-chart">
      <View style={styles.header}>
        <View style={styles.icon}>
          <FontAwesomeIcon icon={faPersonWalking} size={16} color="#287A6A" />
        </View>
        <Text style={styles.title} allowFontScaling={false}>
          {t('movement.history_title')}
        </Text>
      </View>
      <Text style={styles.description} allowFontScaling={false}>
        {t('movement.history_description')}
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue} allowFontScaling={false}>
            {todayDistance
              ? `${todayDistance.value} ${t(
                  `movement.unit_${todayDistance.unit}`,
                )}`
              : '—'}
          </Text>
          <Text style={styles.summaryLabel} allowFontScaling={false}>
            {t('movement.history_today')}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue} allowFontScaling={false}>
            {weekDistance
              ? `${weekDistance.value} ${t(
                  `movement.unit_${weekDistance.unit}`,
                )}`
              : '—'}
          </Text>
          <Text style={styles.summaryLabel} allowFontScaling={false}>
            {t('movement.history_week_total')}
          </Text>
        </View>
      </View>

      {summary.recordedDays > 0 ? (
        <>
          <Text style={styles.chartTitle} allowFontScaling={false}>
            {t('movement.history_daily_distance')}
          </Text>
          <View style={styles.viewport} onLayout={onLayout}>
            {viewportWidth > 0 ? (
              <LineChart
                data={chartData}
                width={plotWidth(viewportWidth)}
                parentWidth={viewportWidth}
                height={160}
                maxValue={maxValue}
                noOfSections={4}
                showFractionalValues
                roundToDigits={2}
                hideDataPoints={false}
                interpolateMissingValues={false}
                extrapolateMissingValues={false}
                dataPointsColor1="#287A6A"
                dataPointsRadius={POINT_RADIUS}
                yAxisLabelWidth={Y_AXIS_WIDTH}
                yAxisThickness={0}
                xAxisThickness={0}
                rulesColor={theme.colors.neutral200}
                rulesThickness={1}
                yAxisTextStyle={styles.axisText}
                color1="#287A6A"
                initialSpacing={chartSpacing(viewportWidth).initialSpacing}
                spacing={chartSpacing(viewportWidth).spacing}
                endSpacing={0}
                disableScroll
                thickness={2}
              />
            ) : null}
          </View>
          <View style={styles.xAxisRow}>
            {weekDates.map(date => (
              <Text
                key={date}
                style={styles.xAxisLabel}
                allowFontScaling={false}
              >
                {formatWeekday(date, locale)}
              </Text>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText} allowFontScaling={false}>
            {t('movement.history_empty')}
          </Text>
        </View>
      )}

      <Text style={styles.note} allowFontScaling={false}>
        {t('movement.history_note')}
      </Text>
    </View>
  );
};
