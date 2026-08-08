import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faWind,
  faThermometerHalf,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing } from '../../theme';
import { WEATHER_SVG } from '../../utils/svgIcons';
import type { AirExposure } from '../../services/api/ExposureService';

interface ExposureAccordionProps {
  airExposure?: AirExposure | null;
  embedded?: boolean;
  onOpenHistory?: () => void;
  ventilation?: string | null;
}

const AQI_LEVELS: { max: number; key: string; color: string }[] = [
  { max: 50,       key: 'aqi_good',               color: '#4CAF50' },
  { max: 100,      key: 'aqi_moderate',             color: '#FFC107' },
  { max: 150,      key: 'aqi_unhealthy_sensitive',  color: '#FF9800' },
  { max: 200,      key: 'aqi_unhealthy',            color: '#F44B4B' },
  { max: 300,      key: 'aqi_very_unhealthy',       color: '#9C27B0' },
  { max: Infinity, key: 'aqi_hazardous',            color: '#7E0023' },
];

type PollutantKey = 'pm25' | 'pm10' | 'no2' | 'so2' | 'o3';

const WHO_THRESHOLDS: {
  key: PollutantKey;
  label: string;
  limit: number;
}[] = [
  { key: 'pm25', label: 'PM2.5', limit: 15 },
  { key: 'pm10', label: 'PM10',  limit: 45 },
  { key: 'no2',  label: 'NO₂',   limit: 25 },
  { key: 'so2',  label: 'SO₂',   limit: 40 },
  { key: 'o3',   label: 'O₃',    limit: 100 },
];

function getAqiInfo(aqi: number | undefined) {
  if (aqi === undefined || !Number.isFinite(aqi)) return null;
  return AQI_LEVELS.find(l => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1];
}

function getOverThresholdLabels(data: AirExposure): string[] {
  return WHO_THRESHOLDS
    .filter(t => {
      const value = data[t.key];
      return typeof value === 'number' && value > t.limit;
    })
    .map(t => t.label);
}

export const ExposureAccordion: React.FC<ExposureAccordionProps> = ({
  airExposure,
  embedded = false,
  onOpenHistory,
  ventilation,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'fr'
    ? 'fr-FR'
    : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';
  const [isExpanded, setIsExpanded] = useState(false);

  const aqiInfo = airExposure
    ? getAqiInfo(airExposure.aqi)
    : null;
  const pm25Color =
    airExposure?.pm25 === undefined
      ? null
      : airExposure.pm25 <= 15
      ? '#4CAF50'
      : airExposure.pm25 <= 35
      ? '#FFC107'
      : airExposure.pm25 <= 55
      ? '#FF9800'
      : '#F44B4B';
  const headerColor = aqiInfo?.color ?? pm25Color ?? '#9E9E9E';
  const statusLabel = aqiInfo
    ? `${t(`exposure.${aqiInfo.key}`)} · AQI ${
        airExposure!.aqi
      }`
    : airExposure?.pm25 !== undefined
    ? `PM2.5 ${airExposure.pm25} µg/m³`
    : t('today.status_unavailable');
  const contextParts = airExposure
    ? [
        airExposure.temperature !== undefined
          ? `${airExposure.temperature}°C`
          : null,
        airExposure.humidity !== undefined
          ? `${airExposure.humidity}% ${t(
              'today.humidity_short',
              { defaultValue: 'humidity' },
            )}`
          : null,
      ].filter((item): item is string => Boolean(item))
    : [];
  const contextLabel = contextParts.length
    ? contextParts.join(' · ')
    : t('exposure.no_data_body');
  const exposureTime = airExposure
    ? new Date(airExposure.timestamp)
    : null;
  const exposureTimeLabel =
    exposureTime && !Number.isNaN(exposureTime.getTime())
      ? exposureTime.toLocaleTimeString(locale, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: embedded ? 0 : spacing('md'),
    },
    header: {
      minHeight: 92,
      borderRadius: 18,
      paddingHorizontal: embedded ? 0 : spacing('md'),
      paddingVertical: spacing('sm'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
      backgroundColor: '#FFFFFF',
    },
    headerExpanded: {
      paddingBottom: spacing('md'),
    },
    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${headerColor}1A`,
    },
    accent: {
      width: 3,
      height: 40,
      borderRadius: 2,
      backgroundColor: headerColor,
    },
    headerCopy: {
      flex: 1,
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
      gap: 5,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: headerColor,
    },
    kicker: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 10,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    headerText: {
      fontSize: 17,
      fontFamily: theme.typography.fontFamily.extraBold,
      color:
        airExposure
          ? headerColor
          : theme.colors.textPrimary,
    },
    contextText: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 10,
      lineHeight: 14,
    },
    chevronButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${headerColor}18`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      backgroundColor: '#F8F8F8',
      borderRadius: 16,
      padding: spacing('md'),
      marginTop: spacing('xs'),
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing('sm'),
      marginBottom: spacing('md'),
    },
    leftColumn: {
      width: 28,
      alignItems: 'center',
      marginTop: 2,
    },
    rightColumn: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    detailText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginVertical: spacing('sm'),
    },
    noDataText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral400,
      textAlign: 'center',
      paddingVertical: spacing('md'),
    },
    historyButton: {
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing('xs'),
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
    },
    historyButtonText: {
      color: theme.colors.orange700,
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
    },
  }), [airExposure, embedded, headerColor, theme]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: !airExposure, expanded: isExpanded }}
        accessibilityLabel={t(
          airExposure
            ? 'exposure.header'
            : 'exposure.header_no_data',
          airExposure
            ? {
                level: aqiInfo
                  ? t(`exposure.${aqiInfo.key}`)
                  : statusLabel,
                aqi: airExposure.aqi ?? '',
              }
            : undefined,
        )}
        style={[
          styles.header,
          isExpanded && styles.headerExpanded,
        ]}
        onPress={() => airExposure && setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        disabled={!airExposure}
      >
        <View style={styles.iconContainer}>
          <SvgXml xml={WEATHER_SVG} width={42} height={42} />
        </View>
        <View style={styles.accent} />
        <View style={styles.headerCopy}>
          <View style={styles.kickerRow}>
            <View style={styles.liveDot} />
            <Text style={styles.kicker} allowFontScaling={false}>
              {t('today.exposure')}
            </Text>
          </View>
          <Text style={styles.headerText} allowFontScaling={false}>
            {statusLabel}
          </Text>
          <Text
            numberOfLines={2}
            style={styles.contextText}
            allowFontScaling={false}
          >
            {contextLabel}
          </Text>
        </View>
        {airExposure && (
          <View style={styles.chevronButton}>
            <FontAwesomeIcon
              icon={(isExpanded ? faChevronUp : faChevronDown) as any}
              size={14}
              color={headerColor}
            />
          </View>
        )}
      </TouchableOpacity>

      {isExpanded && airExposure && (
        <View style={styles.content}>
          <>
              {/* Air Quality */}
              <View style={styles.sectionRow}>
                <View style={styles.leftColumn}>
                  <FontAwesomeIcon icon={faWind as any} size={18} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>
                    {airExposure.aqi !== undefined
                      ? t('exposure.air_quality', {
                          aqi: airExposure.aqi,
                        })
                      : t('exposure.air_quality_label')}
                  </Text>
                  <Text style={styles.detailText} allowFontScaling={false}>
                    {[
                      airExposure.pm25 !== undefined
                        ? `PM2.5: ${airExposure.pm25} µg/m³`
                        : null,
                      airExposure.pm10 !== undefined
                        ? `PM10: ${airExposure.pm10} µg/m³`
                        : null,
                    ]
                      .filter(Boolean)
                      .join('  ·  ')}
                  </Text>
                  {getOverThresholdLabels(airExposure).length >
                  0 ? (
                    <Text
                      style={styles.detailText}
                      allowFontScaling={false}
                    >
                      {t('exposure.main_contributors', {
                        contributors:
                          getOverThresholdLabels(
                            airExposure,
                          ).join(', '),
                      })}
                    </Text>
                  ) : null}
                  {airExposure.indoor_pm25 !== undefined ? (
                    <Text
                      style={styles.detailText}
                      allowFontScaling={false}
                    >
                      {t('exposure.indoor_pm25', {
                        value: airExposure.indoor_pm25,
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Climate */}
              <View style={styles.sectionRow}>
                <View style={styles.leftColumn}>
                  <FontAwesomeIcon icon={faThermometerHalf as any} size={18} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>
                    {airExposure.temperature !== undefined &&
                    airExposure.humidity !== undefined
                      ? t('exposure.humidity', {
                          temp: airExposure.temperature,
                          humidity: airExposure.humidity,
                        })
                      : contextLabel}
                  </Text>
                  {airExposure.indoor_temperature !== undefined ? (
                    <Text
                      style={styles.detailText}
                      allowFontScaling={false}
                    >
                      {t('exposure.indoor_peak', {
                        value: airExposure.indoor_temperature,
                      })}
                    </Text>
                  ) : null}
                  {airExposure.wind_speed !== undefined ? (
                    <Text
                      style={styles.detailText}
                      allowFontScaling={false}
                    >
                      {t('exposure.wind', {
                        speed: airExposure.wind_speed,
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              {/* UV & Exposure */}
              <View style={styles.sectionRow}>
                <View style={styles.leftColumn}>
                  <FontAwesomeIcon icon={faSun as any} size={16} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.rightColumn}>
                  {airExposure.uvi !== undefined ? (
                    <Text
                      style={styles.sectionTitle}
                      allowFontScaling={false}
                    >
                      {airExposure.uvi_level
                      ? t('exposure.uv_index_level', { uvi: airExposure.uvi, level: airExposure.uvi_level })
                      : t('exposure.uv_index', { uvi: airExposure.uvi })}
                    </Text>
                  ) : null}
                  {airExposure.exposure_minutes !== undefined ? (
                    <Text
                      style={styles.detailText}
                      allowFontScaling={false}
                    >
                      {t('exposure.todays_exposure', {
                        minutes:
                          airExposure.exposure_minutes,
                      })}
                      {airExposure.activity_level
                        ? `  ·  ${airExposure.activity_level}`
                        : ''}
                    </Text>
                  ) : null}
                  {exposureTimeLabel ? (
                    <Text style={styles.detailText}>
                      {exposureTimeLabel}
                      {airExposure.indoor !== undefined
                        ? ` · ${
                            airExposure.indoor
                              ? t('exposure.indoors')
                              : t('exposure.outdoors')
                          }`
                        : ''}
                    </Text>
                  ) : null}
                  {ventilation ? (
                    <Text style={styles.detailText}>
                      {t('exposure.home_airflow', {
                        value: t(`profile.ventilation_${ventilation}`, {
                          defaultValue: ventilation,
                        }),
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>
              {onOpenHistory ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onOpenHistory}
                  style={styles.historyButton}
                >
                  <Text style={styles.historyButtonText}>
                    {t('exposure.view_recent')}
                  </Text>
                </TouchableOpacity>
              ) : null}
          </>
        </View>
      )}
    </View>
  );
};
