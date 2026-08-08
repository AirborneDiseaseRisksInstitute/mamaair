import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { radius, spacing, useTheme } from '../../theme';
import type {
  CheckInItemGroup,
  FeelingCheckInExperience,
  FeelingCheckInItem,
  FeelingCheckInSelection,
} from '../../types/recommendationExperience';
import { resolveCheckInOptionIcon } from './checkInOptionIcons';
import { HydrationQuickAdd } from './HydrationQuickAdd';

interface FeelingCheckInFormProps {
  step: CheckInItemGroup;
  experience: FeelingCheckInExperience;
  selection: FeelingCheckInSelection;
  onChange: (selection: FeelingCheckInSelection) => void;
  disabled?: boolean;
  showNoneOption?: boolean;
}

const sortItems = (
  items: FeelingCheckInItem[],
): FeelingCheckInItem[] =>
  [...items].sort(
    (a, b) =>
      (a.displayPriority ?? Number.MAX_SAFE_INTEGER) -
      (b.displayPriority ?? Number.MAX_SAFE_INTEGER),
  );

export const FeelingCheckInForm: React.FC<
  FeelingCheckInFormProps
> = ({
  step,
  experience,
  selection,
  onChange,
  disabled = false,
  showNoneOption = true,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [noneSelected, setNoneSelected] = useState<
    Record<CheckInItemGroup, boolean>
  >({
    wellbeing: false,
    physical: false,
    warning: false,
  });

  const moods = useMemo(
    () => sortItems(experience.moods),
    [experience.moods],
  );
  const feelings = useMemo(
    () => sortItems(experience.feelings),
    [experience.feelings],
  );
  const physicalSymptoms = useMemo(
    () =>
      sortItems(
        experience.mommySymptoms.filter(
          item => item.group === 'physical',
        ),
      ),
    [experience.mommySymptoms],
  );
  const warningSymptoms = useMemo(
    () =>
      sortItems(
        experience.mommySymptoms.filter(
          item => item.group === 'warning',
        ),
      ),
    [experience.mommySymptoms],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          width: '100%',
        },
        warningSection: {
          paddingTop: spacing('xs'),
        },
        warningLead: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: spacing('md'),
          marginBottom: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: '#FFF0F0',
          gap: spacing('sm'),
        },
        warningLeadText: {
          flex: 1,
          color: '#8A2525',
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 13,
          lineHeight: 19,
        },
        groupTitle: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 13,
          marginBottom: spacing('sm'),
        },
        groupSpacing: {
          marginTop: spacing('md'),
          paddingTop: spacing('md'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.neutral200,
        },
        options: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing('sm'),
        },
        option: {
          minHeight: 50,
          flexBasis: '46%',
          flexGrow: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          paddingVertical: spacing('sm'),
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
          backgroundColor: '#FFFFFF',
        },
        optionWide: {
          flexBasis: '100%',
        },
        optionPressed: {
          opacity: 0.78,
          transform: [{ scale: 0.98 }],
        },
        optionSelected: {
          borderColor: theme.colors.orange500,
          backgroundColor: theme.colors.orange50,
        },
        warningOption: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E2BFC2',
        },
        warningOptionSelected: {
          borderColor: '#C73A3A',
          backgroundColor: '#FFE8E8',
        },
        optionIcon: {
          width: 28,
          height: 28,
          marginRight: spacing('sm'),
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        optionLabel: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 13,
          lineHeight: 18,
        },
        warningOptionLabel: {
          color: '#571919',
        },
        check: {
          width: 20,
          height: 20,
          borderRadius: 10,
          marginLeft: spacing('xs'),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.orange500,
        },
        warningCheck: {
          backgroundColor: '#C73A3A',
        },
        noneOption: {
          minHeight: 44,
          marginTop: spacing('md'),
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral300,
          backgroundColor: '#FFFFFF',
        },
        noneOptionSelected: {
          borderColor: theme.colors.orange500,
          backgroundColor: theme.colors.orange50,
        },
        noneText: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 14,
        },
        noneTextSelected: {
          color: theme.colors.orange700,
        },
        emptyText: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 14,
          lineHeight: 20,
          textAlign: 'center',
          paddingVertical: spacing('lg'),
        },
      }),
    [theme],
  );

  const selectedKeysForStep = (
    targetStep: CheckInItemGroup,
  ): string[] => {
    if (targetStep === 'wellbeing') {
      return [...selection.moodKeys, ...selection.feelingKeys];
    }
    const items =
      targetStep === 'physical'
        ? physicalSymptoms
        : warningSymptoms;
    const keys = new Set(items.map(item => item.key));
    return selection.mommySymptomKeys.filter(key => keys.has(key));
  };

  const selectNone = () => {
    if (disabled) return;
    if (step === 'wellbeing') {
      onChange({
        ...selection,
        moodKeys: [],
        feelingKeys: [],
      });
    } else {
      const items =
        step === 'physical'
          ? physicalSymptoms
          : warningSymptoms;
      const groupKeys = new Set(items.map(item => item.key));
      onChange({
        ...selection,
        mommySymptomKeys: selection.mommySymptomKeys.filter(
          key => !groupKeys.has(key),
        ),
      });
    }
    setNoneSelected(previous => ({
      ...previous,
      [step]: true,
    }));
  };

  const toggleItem = (item: FeelingCheckInItem) => {
    if (disabled) return;
    const field =
      item.kind === 'mood'
        ? 'moodKeys'
        : item.kind === 'wellbeingFeeling'
        ? 'feelingKeys'
        : 'mommySymptomKeys';
    const current = selection[field];
    onChange({
      ...selection,
      [field]: current.includes(item.key)
        ? current.filter(key => key !== item.key)
        : [...current, item.key],
    });
    setNoneSelected(previous => ({
      ...previous,
      [step]: false,
    }));
  };

  const renderOption = (
    item: FeelingCheckInItem,
    warning = false,
  ) => {
    const field =
      item.kind === 'mood'
        ? selection.moodKeys
        : item.kind === 'wellbeingFeeling'
        ? selection.feelingKeys
        : selection.mommySymptomKeys;
    const selected = field.includes(item.key);
    const useWideTile =
      item.kind === 'mommySymptom' || item.name.length > 24;
    const iconPresentation = resolveCheckInOptionIcon(item);

    return (
      <Pressable
        key={item.key}
        accessibilityRole="checkbox"
        accessibilityLabel={item.name}
        accessibilityState={{ checked: selected, disabled }}
        disabled={disabled}
        onPress={() => toggleItem(item)}
        style={({ pressed }) => [
          styles.option,
          useWideTile && styles.optionWide,
          warning && styles.warningOption,
          selected && styles.optionSelected,
          selected && warning && styles.warningOptionSelected,
          pressed && styles.optionPressed,
        ]}
      >
        <View
          style={[
            styles.optionIcon,
            {
              backgroundColor:
                iconPresentation.backgroundColor,
            },
          ]}
        >
          <FontAwesomeIcon
            icon={iconPresentation.icon}
            color={iconPresentation.color}
            size={13}
          />
        </View>
        <Text
          style={[
            styles.optionLabel,
            warning && styles.warningOptionLabel,
          ]}
        >
          {item.name}
        </Text>
        {selected ? (
          <View
            style={[
              styles.check,
              warning && styles.warningCheck,
            ]}
          >
            <FontAwesomeIcon
              icon={faCheck}
              color="#FFFFFF"
              size={10}
            />
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderNone = () => {
    const selected =
      noneSelected[step] &&
      selectedKeysForStep(step).length === 0;
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={t('feeling_checkin.none_of_these')}
        accessibilityState={{ checked: selected, disabled }}
        disabled={disabled}
        onPress={selectNone}
        style={({ pressed }) => [
          styles.noneOption,
          selected && styles.noneOptionSelected,
          pressed && styles.optionPressed,
        ]}
      >
        <Text
          style={[
            styles.noneText,
            selected && styles.noneTextSelected,
          ]}
        >
          {selected ? '✓  ' : ''}
          {t('feeling_checkin.none_of_these')}
        </Text>
      </Pressable>
    );
  };

  if (step === 'wellbeing') {
    const total = moods.length + feelings.length;

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.groupTitle}>
            {t('feeling_checkin.everyday_feelings')}
          </Text>
          <View style={styles.options}>
            {moods.map(item => renderOption(item))}
          </View>

          <Text
            style={[
              styles.groupTitle,
              styles.groupSpacing,
            ]}
          >
            {t('feeling_checkin.energy_and_rest')}
          </Text>
          <View style={styles.options}>
            {feelings.map(item => renderOption(item))}
          </View>
          {total === 0 ? (
            <Text style={styles.emptyText}>
              {t('feeling_checkin.no_options')}
            </Text>
          ) : null}
          {showNoneOption ? renderNone() : null}
        </View>

        <HydrationQuickAdd
          currentTotalMl={experience.waterDailyTotalMl}
          goalMl={experience.waterGoalMl}
          selectedIncrementMl={selection.waterIncrementMl}
          disabled={disabled}
          onSelect={amount =>
            onChange({
              ...selection,
              waterIncrementMl: amount,
            })
          }
        />
      </>
    );
  }

  const items =
    step === 'physical'
      ? physicalSymptoms
      : warningSymptoms;
  const warning = step === 'warning';

  return (
    <View
      style={[
        styles.section,
        warning && styles.warningSection,
      ]}
    >
      {warning ? (
        <View style={styles.warningLead}>
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            size={17}
            color="#B12D2D"
          />
          <Text style={styles.warningLeadText}>
            {t('feeling_checkin.warning_note')}
          </Text>
        </View>
      ) : null}
      {items.length > 0 ? (
        <View style={styles.options}>
          {items.map(item =>
            renderOption(item, warning),
          )}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {t('feeling_checkin.no_options')}
        </Text>
      )}
      {showNoneOption ? renderNone() : null}
    </View>
  );
};
