import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDroplet, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { radius, spacing, useTheme } from '../../theme';

interface HydrationQuickAddProps {
  currentTotalMl: number;
  selectedIncrementMl: number;
  onSelect: (amount: number) => void;
  goalMl?: number;
  disabled?: boolean;
}

const GLASS_AMOUNT_ML = 250;
// Input bound only when the API has no goal; this is not a health target.
const DEFAULT_MAX_GLASSES = 8;

export const HydrationQuickAdd: React.FC<HydrationQuickAddProps> = ({
  currentTotalMl,
  selectedIncrementMl,
  onSelect,
  goalMl,
  disabled = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const displayedTotal = currentTotalMl + selectedIncrementMl;
  const progress =
    goalMl && goalMl > 0
      ? Math.min(100, Math.floor((displayedTotal / goalMl) * 100))
      : null;
  const selectedGlassCount = Math.max(
    0,
    Math.round(selectedIncrementMl / GLASS_AMOUNT_ML),
  );
  const maxGlasses =
    goalMl && goalMl > 0
      ? Math.max(1, Math.ceil(goalMl / GLASS_AMOUNT_ML))
      : DEFAULT_MAX_GLASSES;
  const canDecrease = !disabled && selectedIncrementMl > 0;
  const canIncrease = !disabled && selectedGlassCount < maxGlasses;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: spacing('lg'),
          paddingVertical: spacing('md'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.borderColor('#CBE7F4'),
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
          backgroundColor: theme.surfaceColor('#E7F7FF'),
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
          color: theme.accentTextColor('#075F88'),
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
          backgroundColor: theme.surfaceColor('#DCEFF7'),
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
        stepperLabel: {
          marginBottom: spacing('xs'),
          color: theme.accentTextColor('#075F88'),
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        stepper: {
          height: 64,
          flexDirection: 'row',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.borderColor('#B9DEED'),
          borderRadius: radius('md'),
          backgroundColor: theme.colors.surface,
        },
        stepperButton: {
          width: 58,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },
        decreaseButton: {
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: theme.borderColor('#B9DEED'),
        },
        increaseButton: {
          borderLeftWidth: StyleSheet.hairlineWidth,
          borderLeftColor: theme.borderColor('#B9DEED'),
        },
        stepperButtonPressed: {
          backgroundColor: theme.surfaceColor('#E7F7FF'),
        },
        stepperButtonDisabled: {
          opacity: 0.35,
        },
        stepperValue: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        glassCount: {
          color: theme.accentTextColor('#075F88'),
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 17,
          textAlign: 'center',
        },
        selectedAmount: {
          marginTop: 2,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        glassSize: {
          marginTop: spacing('xs'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          textAlign: 'center',
        },
      }),
    [theme],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <FontAwesomeIcon icon={faDroplet} size={16} color="#179FD2" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>{t('today.water_today')}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.total}>
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
            now: Math.min(displayedTotal, goalMl ?? 0),
          }}
          style={styles.track}
        >
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      ) : null}

      <Text style={styles.prompt}>
        {t('feeling_checkin.water_description')}
      </Text>
      <Text style={styles.stepperLabel}>
        {t('feeling_checkin.water_glasses_label')}
      </Text>
      <View style={styles.stepper}>
        <Pressable
          testID="hydration-decrease"
          accessibilityRole="button"
          accessibilityLabel={t('feeling_checkin.decrease_water')}
          accessibilityState={{ disabled: !canDecrease }}
          disabled={!canDecrease}
          hitSlop={8}
          onPress={() =>
            onSelect(Math.max(0, selectedIncrementMl - GLASS_AMOUNT_ML))
          }
          style={({ pressed }) => [
            styles.stepperButton,
            styles.decreaseButton,
            pressed && canDecrease && styles.stepperButtonPressed,
            !canDecrease && styles.stepperButtonDisabled,
          ]}
        >
          <FontAwesomeIcon icon={faMinus} size={16} color="#18779D" />
        </Pressable>

        <View style={styles.stepperValue}>
          <Text
            testID="hydration-glass-count"
            accessibilityLiveRegion="polite"
            style={styles.glassCount}
          >
            {t('feeling_checkin.water_glass_count', {
              count: selectedGlassCount,
            })}
          </Text>
          <Text
            testID="hydration-selected-amount"
            style={styles.selectedAmount}
          >
            {selectedIncrementMl} ml
          </Text>
        </View>

        <Pressable
          testID="hydration-increase"
          accessibilityRole="button"
          accessibilityLabel={t('feeling_checkin.increase_water')}
          accessibilityState={{ disabled: !canIncrease }}
          disabled={!canIncrease}
          hitSlop={8}
          onPress={() => onSelect(selectedIncrementMl + GLASS_AMOUNT_ML)}
          style={({ pressed }) => [
            styles.stepperButton,
            styles.increaseButton,
            pressed && canIncrease && styles.stepperButtonPressed,
            !canIncrease && styles.stepperButtonDisabled,
          ]}
        >
          <FontAwesomeIcon icon={faPlus} size={16} color="#18779D" />
        </Pressable>
      </View>
      <Text style={styles.glassSize}>
        {t('feeling_checkin.water_glass_size', {
          amount: GLASS_AMOUNT_ML,
        })}
      </Text>
    </View>
  );
};
