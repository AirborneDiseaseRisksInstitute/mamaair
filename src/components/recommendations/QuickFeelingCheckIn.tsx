import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBed,
  faChevronDown,
  faChevronUp,
  faDroplet,
  faFaceSmile,
  faPersonPregnant,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { radius, spacing, useTheme } from '../../theme';
import type {
  FeelingCheckInExperience,
  FeelingCheckInSelection,
} from '../../types/recommendationExperience';
import { feelingCheckInItemLabel } from '../../utils/feelingCheckInLabels';
import { FeelingCheckInForm } from './FeelingCheckInForm';
import { HydrationQuickAdd } from './HydrationQuickAdd';

const SECTIONS = [
  {
    key: 'mood',
    title: 'feeling_checkin.mood',
    icon: faFaceSmile,
    color: '#76508F',
    background: '#F4EEFA',
  },
  {
    key: 'feelings',
    title: 'feeling_checkin.wellbeing',
    icon: faBed,
    color: '#2D7B46',
    background: '#EAF6EE',
  },
  {
    key: 'water',
    title: 'feeling_checkin.water',
    icon: faDroplet,
    color: '#075F88',
    background: '#E8F7FC',
  },
  {
    key: 'physical',
    title: 'feeling_checkin.mother_symptoms',
    icon: faPersonPregnant,
    color: '#C84B00',
    background: '#FFF1E6',
  },
  {
    key: 'warning',
    title: 'feeling_checkin.warning_signs',
    icon: faTriangleExclamation,
    color: '#B93838',
    background: '#FFF0F0',
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

interface Props {
  experience: FeelingCheckInExperience;
  selection: FeelingCheckInSelection;
  onChange: (selection: FeelingCheckInSelection) => void;
  disabled: boolean;
  onReveal: (offset: number) => void;
}

export const QuickFeelingCheckIn: React.FC<Props> = ({
  experience,
  selection,
  onChange,
  disabled,
  onReveal,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<SectionKey | null>('mood');
  const revealSection = useRef<SectionKey | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing('sm'),
          borderRadius: radius('lg'),
          borderWidth: 1,
          borderColor: theme.colors.neutral200,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
        },
        open: { borderColor: theme.colors.orange500 },
        warning: { borderColor: theme.borderColor('#E2BFC2') },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 80,
          padding: spacing('md'),
          gap: spacing('sm'),
        },
        pressed: { opacity: 0.7 },
        icon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        copy: { flex: 1 },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 15,
          lineHeight: 21,
        },
        summary: {
          marginTop: 4,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 12,
          lineHeight: 18,
        },
        body: {
          paddingHorizontal: spacing('md'),
          paddingBottom: spacing('md'),
        },
        hint: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 13,
          lineHeight: 19,
          marginBottom: spacing('md'),
        },
        done: {
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-end',
          paddingHorizontal: spacing('md'),
          marginTop: spacing('sm'),
        },
        doneText: {
          color: theme.colors.orange600,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
      }),
    [theme],
  );

  return (
    <View>
      {SECTIONS.map(section => {
        const open = expanded === section.key;
        const items =
          section.key === 'mood'
            ? experience.moods
            : section.key === 'feelings'
            ? experience.feelings
            : experience.mommySymptoms.filter(
                item => item.group === section.key,
              );
        const keys =
          section.key === 'mood'
            ? selection.moodKeys
            : section.key === 'feelings'
            ? selection.feelingKeys
            : selection.mommySymptomKeys;
        const selectedItems = items.filter(item => keys.includes(item.key));
        const labels = selectedItems.map(item =>
          feelingCheckInItemLabel(item, t),
        );
        const summary =
          section.key === 'water'
            ? t('feeling_checkin.water_total', {
                amount: experience.waterDailyTotalMl,
              }) +
              (selection.waterIncrementMl > 0
                ? ` · ${t('feeling_checkin.water_adding', {
                    amount: selection.waterIncrementMl,
                  })}`
                : '')
            : labels.length > 0
            ? labels.join(' · ')
            : t(`feeling_checkin.quick_hint_${section.key}`);

        return (
          <View
            key={section.key}
            onLayout={event => {
              if (revealSection.current === section.key && open) {
                revealSection.current = null;
                onReveal(event.nativeEvent.layout.y);
              }
            }}
            style={[
              styles.card,
              open && styles.open,
              section.key === 'warning' && styles.warning,
            ]}
          >
            <Pressable
              testID={`quick-checkin-toggle-${section.key}`}
              accessibilityRole="button"
              accessibilityLabel={`${t(section.title)}. ${summary}`}
              accessibilityState={{ expanded: open, disabled }}
              disabled={disabled}
              onPress={() => {
                revealSection.current = open ? null : section.key;
                setExpanded(open ? null : section.key);
              }}
              style={({ pressed }) => [
                styles.header,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[styles.icon, { backgroundColor: theme.surfaceColor(section.background) }]}
              >
                <FontAwesomeIcon
                  icon={section.icon}
                  size={18}
                  color={theme.accentTextColor(section.color)}
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{t(section.title)}</Text>
                <Text numberOfLines={2} style={styles.summary}>
                  {summary}
                </Text>
              </View>
              <FontAwesomeIcon
                icon={open ? faChevronUp : faChevronDown}
                size={12}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            {open ? (
              <View style={styles.body}>
                {section.key === 'water' ? (
                  <HydrationQuickAdd
                    currentTotalMl={experience.waterDailyTotalMl}
                    goalMl={experience.waterGoalMl}
                    selectedIncrementMl={selection.waterIncrementMl}
                    onSelect={waterIncrementMl =>
                      onChange({ ...selection, waterIncrementMl })
                    }
                    disabled={disabled}
                  />
                ) : (
                  <>
                    <Text style={styles.hint}>
                      {t('feeling_checkin.quick_select_hint')}
                    </Text>
                    <FeelingCheckInForm
                      step={
                        section.key === 'mood' || section.key === 'feelings'
                          ? 'wellbeing'
                          : section.key
                      }
                      wellbeingSection={
                        section.key === 'mood' || section.key === 'feelings'
                          ? section.key
                          : 'all'
                      }
                      compact
                      showNoneOption={
                        section.key === 'physical' || section.key === 'warning'
                      }
                      experience={experience}
                      selection={selection}
                      onChange={onChange}
                      disabled={disabled}
                    />
                  </>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled }}
                  disabled={disabled}
                  onPress={() => setExpanded(null)}
                  style={({ pressed }) => [
                    styles.done,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.doneText}>
                    {t('feeling_checkin.quick_close_section')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};
