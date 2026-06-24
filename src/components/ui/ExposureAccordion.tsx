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
}

const AQI_LEVELS: { max: number; key: string; color: string }[] = [
  { max: 50,       key: 'aqi_good',               color: '#4CAF50' },
  { max: 100,      key: 'aqi_moderate',             color: '#FFC107' },
  { max: 150,      key: 'aqi_unhealthy_sensitive',  color: '#FF9800' },
  { max: 200,      key: 'aqi_unhealthy',            color: '#F44B4B' },
  { max: 300,      key: 'aqi_very_unhealthy',       color: '#9C27B0' },
  { max: Infinity, key: 'aqi_hazardous',            color: '#7E0023' },
];

const WHO_THRESHOLDS: { key: keyof AirExposure; label: string; limit: number }[] = [
  { key: 'pm25', label: 'PM2.5', limit: 15 },
  { key: 'pm10', label: 'PM10',  limit: 45 },
  { key: 'no2',  label: 'NO₂',   limit: 25 },
  { key: 'so2',  label: 'SO₂',   limit: 40 },
  { key: 'o3',   label: 'O₃',    limit: 100 },
];

function getAqiInfo(aqi: number) {
  return AQI_LEVELS.find(l => aqi <= l.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1];
}

function getOverThresholdLabels(data: AirExposure): string[] {
  return WHO_THRESHOLDS
    .filter(t => (data[t.key] as number) > t.limit)
    .map(t => t.label);
}

export const ExposureAccordion: React.FC<ExposureAccordionProps> = ({ airExposure }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const aqiInfo = airExposure ? getAqiInfo(airExposure.aqi) : null;
  const headerColor = aqiInfo?.color ?? '#9E9E9E';
  const headerLabel = aqiInfo
    ? t('exposure.header', { level: t(`exposure.${aqiInfo.key}`), aqi: airExposure!.aqi })
    : t('exposure.header_no_data');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: spacing('md'),
    },
    header: {
      borderRadius: 12,
      padding: spacing('md'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
    },
    headerExpanded: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    iconContainer: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#FFF',
    },
    chevronButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      backgroundColor: '#F9F9F9',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      padding: spacing('md'),
      marginTop: -1,
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
  }), [theme]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: headerColor }, isExpanded && styles.headerExpanded]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <SvgXml xml={WEATHER_SVG} width={40} height={40} />
        </View>
        <Text style={styles.headerText} allowFontScaling={false}>
          {headerLabel}
        </Text>
        <View style={styles.chevronButton}>
          <FontAwesomeIcon
            icon={(isExpanded ? faChevronUp : faChevronDown) as any}
            size={14}
            color="#FFF"
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {!airExposure ? (
            <Text style={styles.noDataText} allowFontScaling={false}>
              {t('exposure.no_data_body')}
            </Text>
          ) : (
            <>
              {/* Air Quality */}
              <View style={styles.sectionRow}>
                <View style={styles.leftColumn}>
                  <FontAwesomeIcon icon={faWind as any} size={18} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>
                    {t('exposure.air_quality', { aqi: airExposure.aqi })}
                  </Text>
                  <Text style={styles.detailText} allowFontScaling={false}>
                    PM2.5: {airExposure.pm25} µg/m³  ·  PM10: {airExposure.pm10} µg/m³
                  </Text>
                  <Text style={styles.detailText} allowFontScaling={false}>
                    {t('exposure.main_contributors', {
                      contributors: (() => {
                        const over = getOverThresholdLabels(airExposure);
                        return over.length > 0 ? over.join(', ') : t('exposure.within_safe');
                      })(),
                    })}
                  </Text>
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
                    {t('exposure.humidity', { temp: airExposure.temperature, humidity: airExposure.humidity })}
                  </Text>
                  <Text style={styles.detailText} allowFontScaling={false}>
                    {t('exposure.wind', { speed: airExposure.wind_speed })}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* UV & Exposure */}
              <View style={styles.sectionRow}>
                <View style={styles.leftColumn}>
                  <FontAwesomeIcon icon={faSun as any} size={16} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>
                    {airExposure.uvi_level
                      ? t('exposure.uv_index_level', { uvi: airExposure.uvi, level: airExposure.uvi_level })
                      : t('exposure.uv_index', { uvi: airExposure.uvi })}
                  </Text>
                  <Text style={styles.detailText} allowFontScaling={false}>
                    {t('exposure.todays_exposure', { minutes: airExposure.exposure_minutes })}
                    {airExposure.activity_level ? `  ·  ${airExposure.activity_level}` : ''}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};
