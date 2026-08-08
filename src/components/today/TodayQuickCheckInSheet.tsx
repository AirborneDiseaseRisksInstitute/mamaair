import React, { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  faBed,
  faCheck,
  faClock,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../ui';
import { radius, spacing, useTheme } from '../../theme';
import type {
  FeelingCheckInExperience,
  FeelingCheckInItem,
  FeelingCheckInSelection,
  RecommendationExperienceIdentity,
} from '../../types/recommendationExperience';
import { submitFeelingCheckIn } from '../../services/recommendationExperience/FeelingCheckInRepository';
import { HydrationQuickAdd } from '../recommendations/HydrationQuickAdd';
import { resolveCheckInOptionIcon } from '../recommendations/checkInOptionIcons';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';

export type TodayQuickCheckInKind =
  | 'water'
  | 'mood'
  | 'feeling'
  | 'symptom'
  | 'rest';

interface TodayQuickCheckInSheetProps {
  visible: boolean;
  kind: TodayQuickCheckInKind | null;
  experience: FeelingCheckInExperience | null;
  identity: RecommendationExperienceIdentity;
  date: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onOpenHistory?: () => void;
}

const sortItems = (
  items: FeelingCheckInItem[],
): FeelingCheckInItem[] =>
  [...items].sort(
    (a, b) =>
      (a.displayPriority ?? Number.MAX_SAFE_INTEGER) -
      (b.displayPriority ?? Number.MAX_SAFE_INTEGER),
  );

export const TodayQuickCheckInSheet: React.FC<
  TodayQuickCheckInSheetProps
> = ({
  visible,
  kind,
  experience,
  identity,
  date,
  onClose,
  onSaved,
  onOpenHistory,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selection, setSelection] =
    useState<FeelingCheckInSelection | null>(null);
  const [saving, setSaving] = useState(false);
  const [restDurationMinutes, setRestDurationMinutes] =
    useState(10);

  useEffect(() => {
    if (!visible || !experience || !kind) return;
    setSelection({
      ...experience.selection,
      mommySymptomKeys: [
        ...experience.selection.mommySymptomKeys,
      ],
      moodKeys: [...experience.selection.moodKeys],
      feelingKeys: [...experience.selection.feelingKeys],
      waterIncrementMl: 0,
    });
    AccessibilityInfo.announceForAccessibility(
      t(`today.quick_${kind}_title`),
    );
  }, [experience, kind, t, visible]);

  const title = kind
    ? t(`today.quick_${kind}_title`)
    : '';

  const items = useMemo(() => {
    if (!experience || !kind) return [];
    return sortItems(
      kind === 'mood'
        ? experience.moods
        : kind === 'feeling'
        ? experience.feelings
        : kind === 'symptom'
        ? experience.mommySymptoms
        : [],
    );
  }, [experience, kind]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          maxHeight: height * 0.82,
          paddingBottom: insets.bottom + spacing('xs'),
        },
        header: {
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing('sm'),
        },
        heading: {
          flex: 1,
          paddingRight: spacing('sm'),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 21,
          lineHeight: 28,
        },
        closeButton: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.neutral100,
        },
        intro: {
          marginBottom: spacing('md'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 14,
          lineHeight: 20,
        },
        scroll: {
          maxHeight: height * 0.48,
        },
        scrollContent: {
          paddingBottom: spacing('sm'),
        },
        options: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing('sm'),
        },
        option: {
          minHeight: 54,
          flexBasis: '46%',
          flexGrow: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          paddingVertical: spacing('sm'),
          borderRadius: radius('md'),
          borderWidth: 1.5,
          borderColor: theme.colors.neutral200,
          backgroundColor: theme.colors.neutral50,
        },
        selectedOption: {
          borderColor: theme.colors.orange500,
          backgroundColor: theme.colors.orange100,
        },
        optionIcon: {
          width: 28,
          height: 28,
          marginRight: spacing('sm'),
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        optionText: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 13,
          lineHeight: 18,
        },
        selectedMark: {
          width: 20,
          height: 20,
          marginLeft: spacing('xs'),
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.orange500,
        },
        saveButton: {
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing('lg'),
          borderRadius: radius('md'),
          backgroundColor: saving
            ? theme.colors.neutral300
            : theme.colors.orange500,
        },
        saveText: {
          color: '#FFFFFF',
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 15,
        },
        emptyText: {
          paddingVertical: spacing('xl'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 14,
          lineHeight: 21,
          textAlign: 'center',
        },
        restOptions: {
          flexDirection: 'row',
          gap: spacing('sm'),
        },
        restOption: {
          flex: 1,
          minHeight: 72,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius('md'),
          borderWidth: 1.5,
          borderColor: theme.colors.neutral200,
          backgroundColor: theme.colors.neutral50,
        },
        restOptionSelected: {
          borderColor: theme.colors.orange500,
          backgroundColor: theme.colors.orange100,
        },
        restOptionText: {
          marginTop: spacing('xs'),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        historyButton: {
          minHeight: 42,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing('xs'),
        },
        historyText: {
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
        },
      }),
    [height, insets.bottom, saving, theme],
  );

  if (!experience || !selection || !kind) {
    return null;
  }

  const selectedKeys =
    kind === 'mood'
      ? selection.moodKeys
      : kind === 'symptom'
      ? selection.mommySymptomKeys
      : selection.feelingKeys;

  const toggleItem = (item: FeelingCheckInItem) => {
    const field =
      kind === 'mood'
        ? 'moodKeys'
        : kind === 'symptom'
        ? 'mommySymptomKeys'
        : 'feelingKeys';
    const current = selection[field];
    setSelection({
      ...selection,
      [field]: current.includes(item.key)
        ? current.filter(key => key !== item.key)
        : [...current, item.key],
    });
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (kind === 'rest') {
        const now = new Date().toISOString();
        useRecommendationExperienceStore
          .getState()
          .ensureOwner(identity);
        useRecommendationExperienceStore
          .getState()
          .saveDailyMoment({
            key: 'quick-rest',
            date,
            kind: 'rest',
            completed: true,
            durationMinutes: restDurationMinutes,
            recordedAt:
              useRecommendationExperienceStore
                .getState()
                .getDailyMoment(date, 'quick-rest')
                ?.recordedAt ?? now,
            updatedAt: now,
          });
        await onSaved();
        AccessibilityInfo.announceForAccessibility(
          t('today.rest_logged_announcement'),
        );
        onClose();
        return;
      }
      await submitFeelingCheckIn(
        identity,
        date,
        experience,
        selection,
      );
      await onSaved();
      AccessibilityInfo.announceForAccessibility(
        t('today.checkin_saved_announcement'),
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      showHandle
    >
      <View
        accessibilityViewIsModal
        accessibilityLabel={title}
        style={styles.root}
      >
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            style={styles.heading}
          >
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
            style={styles.closeButton}
          >
            <FontAwesomeIcon
              icon={faTimes}
              size={18}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>

        <Text style={styles.intro}>
          {kind === 'water'
            ? t('today.quick_water_description')
            : kind === 'rest'
            ? t('today.quick_rest_description')
            : kind === 'symptom'
            ? t('today.quick_symptom_description')
            : t('today.quick_checkin_description')}
        </Text>

        {kind === 'water' ? (
          <HydrationQuickAdd
            currentTotalMl={experience.waterDailyTotalMl}
            goalMl={experience.waterGoalMl}
            selectedIncrementMl={selection.waterIncrementMl}
            onSelect={amount =>
              setSelection({
                ...selection,
                waterIncrementMl: amount,
              })
            }
          />
        ) : kind === 'rest' ? (
          <View style={styles.restOptions}>
            {[5, 10, 20].map(minutes => {
              const selected =
                restDurationMinutes === minutes;
              return (
                <Pressable
                  key={minutes}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() =>
                    setRestDurationMinutes(minutes)
                  }
                  style={[
                    styles.restOption,
                    selected &&
                      styles.restOptionSelected,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={minutes === 20 ? faBed : faClock}
                    size={15}
                    color={theme.colors.orange600}
                  />
                  <Text style={styles.restOptionText}>
                    {t('today.rest_minutes', { minutes })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : items.length > 0 ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <View style={styles.options}>
              {items.map(item => {
                const selected = selectedKeys.includes(item.key);
                const iconPresentation =
                  resolveCheckInOptionIcon(item);
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.name}
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleItem(item)}
                    style={[
                      styles.option,
                      selected && styles.selectedOption,
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
                    <Text style={styles.optionText}>
                      {item.name}
                    </Text>
                    {selected ? (
                      <View style={styles.selectedMark}>
                        <FontAwesomeIcon
                          icon={faCheck}
                          size={10}
                          color="#FFFFFF"
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>
            {t('feeling_checkin.no_options')}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={save}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>
            {saving
              ? t('feeling_checkin.saving')
              : t('today.save_checkin')}
          </Text>
        </Pressable>
        {kind === 'symptom' && onOpenHistory ? (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenHistory}
            style={styles.historyButton}
          >
            <Text style={styles.historyText}>
              {t('today.view_symptom_history')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
};
