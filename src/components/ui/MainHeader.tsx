import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBrain, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../../theme';
import { DIET_SVG, RUNNING_SVG, BEHAVIOUR_SVG } from '../../utils/svgIcons';
import { useUserStore } from '../../store/useUserStore';
import { responsiveUtils } from '../../utils/responsiveUtils';
import { getCurrentPregnancyWeek } from '../../utils/pregnancyUtils';

interface HeaderIcon {
  type: 'food' | 'exercise' | 'heart' | 'mental';
  count: number;
}

interface MainHeaderProps {
  weekNumber?: string;
  icons?: HeaderIcon[];
  onProfilePress?: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  weekNumber = '19th Week',
  icons = [
    { type: 'food', count: 0 },
    { type: 'exercise', count: 0 },
    { type: 'heart', count: 0 },
    { type: 'mental', count: 0 },
  ],
  onProfilePress,
}) => {
  const theme = useTheme();
  const { profile } = useUserStore();
  const defaultPhotoSource = require('../../assets/images/addPhoto.png');
  const profilePhotoSource = profile.photo ? { uri: profile.photo } : defaultPhotoSource;
  const currentWeek = getCurrentPregnancyWeek(profile.pregnancyWeek, profile.pregnancyWeekSetDate);
  const displayWeek = currentWeek ? `Week ${currentWeek}` : weekNumber;

  const iconConfig = {
    food: {
      svg: DIET_SVG,
      wrapperStyle: { backgroundColor: '#E8F5E9' },
      badgeColor: '#4CAF50',
      size: 16,
    },
    exercise: {
      svg: RUNNING_SVG,
      wrapperStyle: { backgroundColor: '#FFF9E6' },
      badgeColor: '#FF9800',
      size: 16,
    },
    heart: {
      svg: BEHAVIOUR_SVG,
      wrapperStyle: { backgroundColor: '#FFE5E5' },
      badgeColor: '#F44336',
      size: 14,
    },
    mental: {
      icon: faBrain,
      iconColor: '#70428F',
      wrapperStyle: { backgroundColor: '#F2E8F7' },
      badgeColor: '#70428F',
      size: 14,
    },
  };

  const styles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing('md'),
      paddingTop: spacing('xl'),
      paddingBottom: spacing('md'),
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 3,
    },
    weekContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
    },
    calendarIcon: {
      color: theme.colors.orange500,
    },
    weekText: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
    },
    iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
    },
    iconWrapper: {
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      color: '#fff',
      fontSize: responsiveUtils.getBadgeFontSize(),
      fontFamily: theme.typography.fontFamily.bold,
    },
    profileContainer: {
      marginLeft: spacing('xs'),
    },
    profileImage: {
      width: 38,
      height: 38,
      borderRadius: 19,
      resizeMode: 'cover',
    },
  }), [theme]);

  return (
    <View style={styles.header}>
      <View style={styles.weekContainer}>
        <FontAwesomeIcon 
          icon={faCalendar as any} 
          size={20} 
          style={styles.calendarIcon} 
        />
        <Text 
          style={styles.weekText}
          allowFontScaling={false}
        >
          {displayWeek}
        </Text>
      </View>

      <View style={styles.iconsContainer}>
        {icons.map(item => {
          const config = iconConfig[item.type];
          return (
            <View 
              key={item.type}
              style={[styles.iconWrapper, config.wrapperStyle]}
            >
              {'svg' in config ? (
                <SvgXml
                  xml={config.svg}
                  width={config.size}
                  height={config.size}
                />
              ) : (
                <FontAwesomeIcon
                  icon={config.icon as any}
                  size={config.size}
                  color={config.iconColor}
                />
              )}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: config.badgeColor },
                ]}
              >
                <Text
                  style={styles.badgeText}
                  allowFontScaling={false}
                >
                  {item.count}
                </Text>
              </View>
            </View>
          );
        })}
        <TouchableOpacity 
          style={styles.profileContainer}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <Image
            source={profilePhotoSource}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
