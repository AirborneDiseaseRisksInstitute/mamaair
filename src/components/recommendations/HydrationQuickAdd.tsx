import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCheck,
  faDroplet,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { radius, spacing, useTheme } from '../../theme';

interface HydrationQuickAddProps {
  currentTotalMl: number;
  selectedIncrementMl: number;
  onSelect: (amount: number) => void;
  goalMl?: number;
  amounts?: number[];
  disabled?: boolean;
}

const DEFAULT_AMOUNTS = [100, 250, 500];

export const HydrationQuickAdd: React.FC<
  HydrationQuickAddProps
> = ({
  currentTotalMl,
  selectedIncrementMl,
  onSelect,
  goalMl,
  amounts = DEFAULT_AMOUNTS,
  disabled = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const displayedTotal = currentTotalMl + selectedIncrementMl;
  const progress =
    goalMl && goalMl > 0
      ? Math.min(100, Math.round((displayedTotal / goalMl) * 100))
      : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: spacing('lg'),
          paddingVertical: spacing('md'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#CBE7F4',
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        icon: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          backgroundColor: '#E7F7FF',
        },
        copy: {
          flex: 1,
        },
        label: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        total: {
          marginTop: 1,
          color: '#075F88',
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 18,
        },
        goal: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        track: {
          height: 5,
          overflow: 'hidden',
          marginTop: spacing('sm'),
          borderRadius: 3,
          backgroundColor: '#DCEFF7',
        },
        fill: {
          height: '100%',
          borderRadius: 3,
          backgroundColor: '#179FD2',
        },
        prompt: {
          marginTop: spacing('md'),
          marginBottom: spacing('sm'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 13,
        },
        segmented: {
          minHeight: 50,
          flexDirection: 'row',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#B9DEED',
          borderRadius: radius('md'),
          backgroundColor: '#FFFFFF',
        },
        segment: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        },
        segmentBorder: {
          borderLeftWidth: StyleSheet.hairlineWidth,
          borderLeftColor: '#B9DEED',
        },
        segmentSelected: {
          backgroundColor: '#DDF4FD',
        },
        segmentPressed: {
          opacity: 0.72,
        },
        segmentText: {
          color: '#18779D',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        segmentTextSelected: {
          color: '#075F88',
        },
        selectionHint: {
          minHeight: 18,
          marginTop: spacing('xs'),
          color: '#18779D',
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 11,
          textAlign: 'right',
        },
      }),
    [theme],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <FontAwesomeIcon
            icon={faDroplet}
            size={16}
            color="#179FD2"
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>
            {t('today.water_today')}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={styles.total}
          >
            {displayedTotal} ml
          </Text>
        </View>
        {goalMl && goalMl > 0 ? (
          <Text style={styles.goal}>
            {t('today.water_goal', {
              amount: goalMl,
            })}
          </Text>
        ) : null}
      </View>

      {progress !== null ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: goalMl,
            now: displayedTotal,
          }}
          style={styles.track}
        >
          <View
            style={[
              styles.fill,
              { width: `${progress}%` },
            ]}
          />
        </View>
      ) : null}

      <Text style={styles.prompt}>
        {t('feeling_checkin.water_description')}
      </Text>
      <View
        accessibilityRole="radiogroup"
        style={styles.segmented}
      >
        {amounts.map((amount, index) => {
          const selected = selectedIncrementMl === amount;
          return (
            <Pressable
              key={amount}
              accessibilityRole="radio"
              accessibilityLabel={t(
                'feeling_checkin.add_water',
                { amount },
              )}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onSelect(selected ? 0 : amount)}
              style={({ pressed }) => [
                styles.segment,
                index > 0 && styles.segmentBorder,
                selected && styles.segmentSelected,
                pressed && styles.segmentPressed,
              ]}
            >
              {selected ? (
                <FontAwesomeIcon
                  icon={faCheck}
                  size={10}
                  color="#075F88"
                />
              ) : null}
              <Text
                style={[
                  styles.segmentText,
                  selected && styles.segmentTextSelected,
                ]}
              >
                +{amount} ml
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={styles.selectionHint}
      >
        {selectedIncrementMl > 0
          ? t('feeling_checkin.water_adding', {
              amount: selectedIncrementMl,
            })
          : ' '}
      </Text>
    </View>
  );
};
