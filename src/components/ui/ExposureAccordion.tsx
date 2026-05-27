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
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';
import { WEATHER_SVG } from '../../utils/svgIcons';

interface ExposureAccordionProps {
  level?: number;
  maxLevel?: number;
}

export const ExposureAccordion: React.FC<ExposureAccordionProps> = ({
  level = 7,
  maxLevel = 8,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: spacing('md'),
    },
    header: {
      backgroundColor: '#F44B4B',
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
      backgroundColor: '#FFF5F5',
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
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    sectionTitleSecondary: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    detailText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginBottom: spacing('xs'),
    },
    vertLine: {
      height: spacing('md'),
      borderLeftWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.neutral300,
      marginVertical: spacing('xs'),
      marginLeft: 2,
    },
    inlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('xs'),
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginVertical: spacing('md'),
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.header,
          isExpanded && styles.headerExpanded,
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <SvgXml xml={WEATHER_SVG} width={40} height={40} />
        </View>
        <Text style={styles.headerText} allowFontScaling={false}>
          Exposure: Unhealthy (Level {typeof level === 'number' ? level.toFixed(2) : level}/{maxLevel})
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
          {/* Air Quality Section */}
          <View style={styles.sectionRow}>
            <View style={styles.leftColumn}>
              <FontAwesomeIcon
                icon={faWind as any}
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.rightColumn}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>
                Air Quality: Poor (Level 5/6)
              </Text>
              <View style={styles.vertLine} />
              <Text style={styles.detailText} allowFontScaling={false}>
                Main contributors: vehicle exhaust, road dust
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Climate Risk Section */}
          <View style={styles.sectionRow}>
            <View style={styles.leftColumn}>
              <FontAwesomeIcon
                icon={faThermometerHalf as any}
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.rightColumn}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>
                Climate Risk: High (Level 3/4)
              </Text>
              <View style={styles.vertLine} />
              <Text style={styles.detailText} allowFontScaling={false}>
                Condition: Hot, dry air with low wind flow
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Conditions List */}
          <View style={styles.sectionRow}>
            <View style={styles.leftColumn}>
              <FontAwesomeIcon
                icon={faSun as any}
                size={16}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.rightColumn}>
              <Text style={styles.sectionTitleSecondary} allowFontScaling={false}>
                Dusty morning near feeder road
              </Text>
              <View style={styles.vertLine} />
              <Text style={styles.detailText} allowFontScaling={false}>
                Exhaust near matatu stages
              </Text>
              <View style={styles.vertLine} />
              <Text style={styles.detailText} allowFontScaling={false}>
                Evening still air
              </Text>
              <View style={styles.vertLine} />
              <View style={styles.inlineRow}>
                <FontAwesomeIcon
                  icon={faMapMarkerAlt as any}
                  size={14}
                  color={theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.detailText} allowFontScaling={false}>
                  Residual smoke from cooking
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

