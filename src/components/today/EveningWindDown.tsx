import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBed,
  faCheck,
  faPersonWalking,
  faRotate,
  faWind,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { spacing, useTheme } from '../../theme';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import type {
  DailyMomentKind,
  DailyMomentRecord,
  RecommendationExperienceIdentity,
} from '../../types/recommendationExperience';

interface EveningWindDownProps {
  date: string;
  identity: RecommendationExperienceIdentity;
  onChanged?: () => void;
}

const WIND_DOWN_ITEMS: Array<{
  key: string;
  kind: DailyMomentKind;
  titleKey: string;
  icon: typeof faBed;
}> = [
  {
    key: 'evening-stretch',
    kind: 'stretch',
    titleKey: 'today.evening_stretch',
    icon: faPersonWalking,
  },
  {
    key: 'evening-ventilation',
    kind: 'ventilation',
    titleKey: 'today.evening_ventilation',
    icon: faWind,
  },
  {
    key: 'evening-sleep',
    kind: 'sleep',
    titleKey: 'today.evening_sleep',
    icon: faBed,
  },
  {
    key: 'evening-review',
    kind: 'review',
    titleKey: 'today.evening_review',
    icon: faRotate,
  },
];
const EMPTY_MOMENTS: Record<string, DailyMomentRecord> = {};

export const EveningWindDown: React.FC<
  EveningWindDownProps
> = ({ date, identity, onChanged }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const moments = useRecommendationExperienceStore(
    state => state.dailyMoments[date] ?? EMPTY_MOMENTS,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: spacing('xl'),
        },
        headingRow: {
          minHeight: 54,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.orange500,
          backgroundColor: '#FFF7EF',
        },
        headingIcon: {
          width: 30,
          height: 30,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          borderRadius: 15,
          backgroundColor: '#FFFFFF',
        },
        headingCopy: {
          flex: 1,
        },
        heading: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        optional: {
          paddingHorizontal: spacing('xs'),
          paddingVertical: 3,
          borderRadius: 8,
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 9,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          backgroundColor: '#FFFFFF',
        },
        description: {
          marginTop: 1,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
          lineHeight: 14,
        },
        rows: {
          paddingLeft: spacing('sm'),
        },
        item: {
          minHeight: 46,
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: spacing('sm'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral200,
        },
        itemComplete: {
          backgroundColor: '#FFFCF8',
        },
        checkbox: {
          width: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          borderWidth: 1.5,
          borderColor: theme.colors.orange300,
          borderRadius: 6,
          backgroundColor: '#FFFFFF',
        },
        checkboxComplete: {
          borderColor: theme.colors.orange500,
          backgroundColor: theme.colors.orange500,
        },
        itemIcon: {
          width: 24,
          alignItems: 'flex-start',
          justifyContent: 'center',
        },
        title: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 11,
          lineHeight: 16,
        },
        titleComplete: {
          color: theme.colors.textSecondary,
        },
      }),
    [theme],
  );

  const toggle = (item: (typeof WIND_DOWN_ITEMS)[number]) => {
    const store = useRecommendationExperienceStore.getState();
    store.ensureOwner(identity);
    const current = store.getDailyMoment(date, item.key);
    if (current?.completed) {
      store.removeDailyMoment(date, item.key);
    } else {
      const now = new Date().toISOString();
      store.saveDailyMoment({
        key: item.key,
        date,
        kind: item.kind,
        completed: true,
        recordedAt: current?.recordedAt ?? now,
        updatedAt: now,
      });
    }
    onChanged?.();
  };

  return (
    <View style={styles.root}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <FontAwesomeIcon
            icon={faBed}
            size={13}
            color={theme.colors.orange700}
          />
        </View>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('today.evening_title')}
          </Text>
          <Text numberOfLines={1} style={styles.description}>
            {t('today.evening_description')}
          </Text>
        </View>
        <Text style={styles.optional}>
          {t('today.optional')}
        </Text>
      </View>
      <View style={styles.rows}>
        {WIND_DOWN_ITEMS.map(item => {
          const completed = Boolean(moments[item.key]?.completed);
          return (
            <Pressable
              key={item.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: completed }}
              accessibilityLabel={t(item.titleKey)}
              onPress={() => toggle(item)}
              style={[
                styles.item,
                completed && styles.itemComplete,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  completed && styles.checkboxComplete,
                ]}
              >
                {completed ? (
                  <FontAwesomeIcon
                    icon={faCheck}
                    size={10}
                    color="#FFFFFF"
                  />
                ) : null}
              </View>
              <View style={styles.itemIcon}>
                <FontAwesomeIcon
                  icon={item.icon}
                  size={11}
                  color={theme.colors.orange700}
                />
              </View>
              <Text
                style={[
                  styles.title,
                  completed && styles.titleComplete,
                ]}
              >
                {t(item.titleKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
