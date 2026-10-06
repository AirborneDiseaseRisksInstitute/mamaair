import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faDroplet,
  faFaceSmile,
  faLeaf,
  faPersonPregnant,
  faRotateRight,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { radius, spacing, useTheme } from '../theme';
import { useUserStore } from '../store/useUserStore';
import {
  loadSymptomHistoryDay,
  type SymptomHistoryDay,
  type SymptomHistoryClassEntry,
  type SymptomHistoryEntry,
} from '../services/recommendationExperience/SymptomHistoryRepository';
import type { SymptomClassKey } from '../services/recommendationExperience/SymptomClassTrendRepository';
import type { RecommendationExperienceIdentity } from '../types/recommendationExperience';
import { formatLocalDate } from '../utils/dateUtils';
import { feelingCheckInItemLabel } from '../utils/feelingCheckInLabels';
import { resolveCheckInOptionIcon } from '../components/recommendations/checkInOptionIcons';

interface SymptomsHistoryScreenProps {
  onBack?: () => void;
}

const localDate = (date = new Date()): string => formatLocalDate(date);

const addDays = (value: string, amount: number): string => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return localDate(date);
};

const displayDate = (value: string, locale: string): string =>
  new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const CLASS_LABEL_KEYS: Record<SymptomClassKey, string> = {
  class1: 'mother.emergency',
  class2: 'mother.systemic',
  class3: 'mother.fetal',
  class4: 'mother.lifestyle',
};

export const SymptomsHistoryScreen: React.FC<SymptomsHistoryScreenProps> = ({
  onBack,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale =
    i18n.resolvedLanguage === 'fr'
      ? 'fr-FR'
      : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';
  const insets = useSafeAreaInsets();
  const profile = useUserStore(state => state.profile);
  const today = useMemo(() => localDate(), []);
  const [date, setDate] = useState(today);
  const [day, setDay] = useState<SymptomHistoryDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const identity = useMemo<RecommendationExperienceIdentity>(
    () => ({
      backendUserId: profile.backendUserId,
      email: profile.email,
    }),
    [profile.backendUserId, profile.email],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setDay(await loadSymptomHistoryDay(identity, date));
    } catch {
      setFailed(true);
      setDay(null);
    } finally {
      setLoading(false);
    }
  }, [date, identity]);

  useEffect(() => {
    load();
  }, [load]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.surfaceColor('#FFF9F5'),
        },
        header: {
          minHeight: 60,
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top,
          paddingHorizontal: spacing('sm'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral200,
          backgroundColor: theme.colors.surface,
        },
        back: {
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 18,
        },
        dateBar: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing('md'),
          backgroundColor: theme.colors.surface,
        },
        dateButton: {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.neutral100,
        },
        dateButtonDisabled: {
          opacity: 0.35,
        },
        date: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 14,
          textAlign: 'center',
        },
        content: {
          padding: spacing('md'),
          paddingBottom: insets.bottom + spacing('xl'),
        },
        onlineNotice: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: spacing('sm'),
          marginBottom: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: theme.surfaceColor('#FFF3E7'),
          gap: spacing('sm'),
        },
        onlineNoticeText: {
          flex: 1,
          color: theme.accentTextColor('#805025'),
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 12,
          lineHeight: 18,
        },
        section: {
          marginBottom: spacing('lg'),
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing('xs'),
        },
        sectionIcon: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          backgroundColor: theme.colors.orange50,
        },
        warningIcon: {
          backgroundColor: theme.surfaceColor('#FFF0F0'),
        },
        babyIcon: {
          backgroundColor: theme.surfaceColor('#F4EEFA'),
        },
        sectionTitle: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 14,
        },
        count: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        list: {
          overflow: 'hidden',
          borderRadius: radius('md'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
          backgroundColor: theme.colors.surface,
        },
        row: {
          minHeight: 50,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
        },
        rowBorder: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.neutral200,
        },
        check: {
          width: 20,
          height: 20,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          backgroundColor: theme.colors.orange500,
        },
        detailIcon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
        },
        waterIcon: {
          backgroundColor: theme.surfaceColor('#E8F7FC'),
        },
        warningCheck: {
          backgroundColor: '#B93838',
        },
        name: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 14,
          lineHeight: 20,
        },
        classCopy: {
          flex: 1,
        },
        empty: {
          alignItems: 'center',
          paddingHorizontal: spacing('lg'),
          paddingVertical: spacing('xl'),
          borderRadius: radius('lg'),
          backgroundColor: theme.colors.surface,
        },
        emptyIcon: {
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing('md'),
          backgroundColor: theme.colors.orange50,
        },
        emptyTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 16,
          textAlign: 'center',
        },
        emptyText: {
          marginTop: spacing('xs'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 13,
          lineHeight: 19,
          textAlign: 'center',
        },
        center: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing('xl'),
        },
        retry: {
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing('md'),
          paddingHorizontal: spacing('lg'),
          borderRadius: 22,
          backgroundColor: theme.colors.orange500,
          gap: spacing('sm'),
        },
        retryText: {
          color: '#FFFFFF',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 14,
        },
      }),
    [insets.bottom, insets.top, theme],
  );

  const renderDetailSection = (
    title: string,
    entries: SymptomHistoryEntry[],
    kind: 'mood' | 'wellbeing' | 'physical' | 'warning',
  ) => {
    if (entries.length === 0) return null;

    const sectionPresentation = {
      mood: {
        icon: faFaceSmile,
        color: theme.accentTextColor('#76508F'),
        backgroundColor: theme.surfaceColor('#F4EEFA'),
      },
      wellbeing: {
        icon: faLeaf,
        color: theme.accentTextColor('#2D7B46'),
        backgroundColor: theme.surfaceColor('#EAF6EE'),
      },
      physical: {
        icon: faPersonPregnant,
        color: theme.colors.orange500,
        backgroundColor: theme.colors.orange50,
      },
      warning: {
        icon: faTriangleExclamation,
        color: theme.accentTextColor('#B93838'),
        backgroundColor: theme.surfaceColor('#FFF0F0'),
      },
    }[kind];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: sectionPresentation.backgroundColor },
            ]}
          >
            <FontAwesomeIcon
              icon={sectionPresentation.icon}
              size={14}
              color={sectionPresentation.color}
            />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.count}>
            {t('symptoms.recorded_count', {
              count: entries.length,
            })}
          </Text>
        </View>
        <View style={styles.list}>
          {entries.map((entry, index) => {
            const optionPresentation = resolveCheckInOptionIcon(entry);
            return (
              <View
                key={entry.key}
                style={[styles.row, index > 0 && styles.rowBorder]}
              >
                <View
                  style={[
                    styles.detailIcon,
                    {
                      backgroundColor: theme.surfaceColor(optionPresentation.backgroundColor),
                    },
                  ]}
                >
                  <FontAwesomeIcon
                    icon={optionPresentation.icon}
                    size={14}
                    color={theme.accentTextColor(optionPresentation.color)}
                  />
                </View>
                <Text style={styles.name}>
                  {feelingCheckInItemLabel(entry, t)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderWaterSection = (waterTotalMl: number) => {
    if (waterTotalMl <= 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, styles.waterIcon]}>
            <FontAwesomeIcon icon={faDroplet} size={14} color="#179FD2" />
          </View>
          <Text style={styles.sectionTitle}>{t('symptoms.water')}</Text>
        </View>
        <View style={styles.list}>
          <View style={styles.row}>
            <View style={[styles.detailIcon, styles.waterIcon]}>
              <FontAwesomeIcon icon={faDroplet} size={14} color="#179FD2" />
            </View>
            <Text style={styles.name}>
              {t('symptoms.water_amount', { amount: waterTotalMl })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderClassSection = (entries: SymptomHistoryClassEntry[]) => {
    if (entries.length === 0) return null;
    const totalCount = entries.reduce((sum, entry) => sum + entry.total, 0);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, styles.warningIcon]}>
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              size={14}
              color="#B93838"
            />
          </View>
          <Text style={styles.sectionTitle}>
            {t('symptoms.symptom_classes')}
          </Text>
          <Text style={styles.count}>
            {t('symptoms.recorded_count', {
              count: totalCount,
            })}
          </Text>
        </View>
        <View style={styles.list}>
          {entries.map((entry, index) => (
            <View
              key={entry.key}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <View style={[styles.check, styles.warningCheck]}>
                <FontAwesomeIcon icon={faCheck} size={10} color="#FFFFFF" />
              </View>
              <View style={styles.classCopy}>
                <Text style={styles.name}>
                  {t('symptoms.class_level', {
                    level: entry.level,
                    label: t(CLASS_LABEL_KEYS[entry.key]),
                  })}
                </Text>
                <Text style={styles.onlineNoticeText}>
                  {t('symptoms.class_count_summary', {
                    count: entry.total,
                    mother: entry.mommyCount,
                    baby: entry.babyCount,
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const total = day?.classes.reduce((sum, entry) => sum + entry.total, 0) ?? 0;
  const detailCount = day
    ? day.moods.length +
      day.feelings.length +
      day.physical.length +
      day.warning.length
    : 0;
  const hasDetails = detailCount > 0 || (day?.waterTotalMl ?? 0) > 0;
  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack}
          style={styles.back}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={19}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          {t('symptoms.history_title')}
        </Text>
      </View>

      <View style={styles.dateBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDate(previous => addDays(previous, -1))}
          style={styles.dateButton}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            size={13}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.date}>{displayDate(date, locale)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: date >= today }}
          disabled={date >= today}
          onPress={() => setDate(previous => addDays(previous, 1))}
          style={[
            styles.dateButton,
            date >= today && styles.dateButtonDisabled,
          ]}
        >
          <FontAwesomeIcon
            icon={faChevronRight}
            size={13}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.orange500} />
        </View>
      ) : failed || !day ? (
        <View style={styles.center}>
          <FontAwesomeIcon
            icon={faCircleExclamation}
            size={28}
            color="#B93838"
          />
          <Text style={styles.emptyText}>
            {t('symptoms.history_load_failed')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={load}
            style={styles.retry}
          >
            <FontAwesomeIcon icon={faRotateRight} size={13} color="#FFFFFF" />
            <Text style={styles.retryText}>
              {t('feeling_checkin.try_again')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {hasDetails || total > 0 ? (
            <>
              {renderDetailSection(t('symptoms.mood'), day.moods, 'mood')}
              {renderDetailSection(
                t('feeling_checkin.wellbeing'),
                day.feelings,
                'wellbeing',
              )}
              {renderWaterSection(day.waterTotalMl)}
              {renderDetailSection(
                t('symptoms.physical_symptoms'),
                day.physical,
                'physical',
              )}
              {renderDetailSection(
                t('symptoms.warning_signs'),
                day.warning,
                'warning',
              )}
              {renderClassSection(day.classes)}
            </>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <FontAwesomeIcon
                  icon={faCheck}
                  size={20}
                  color={theme.colors.orange500}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {t(
                  day.recordState === 'recorded'
                    ? 'symptoms.none_reported'
                    : 'symptoms.no_checkin',
                )}
              </Text>
              <Text style={styles.emptyText}>
                {t(
                  day.recordState === 'recorded'
                    ? 'symptoms.none_reported_description'
                    : 'symptoms.no_checkin_description',
                )}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
