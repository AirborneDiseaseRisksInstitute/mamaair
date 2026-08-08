import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import {
  ProfileEditSheet,
  type ProfileEditSection,
} from '../components/profile/ProfileEditSheet';
import { BackButton } from '../components/ui';
import { useMetaChoices } from '../hooks/useMetaChoices';
import { useUserStore } from '../store/useUserStore';
import { spacing, useTheme } from '../theme';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { responsiveUtils } from '../utils/responsiveUtils';

interface ProfileInformationScreenProps {
  onBack?: () => void;
}

const joinSummary = (
  ...values: Array<string | null | undefined | false>
): string => values.filter(Boolean).join('  •  ') || '-';

const formatBirthday = (
  value: string | null,
  locale: string,
): string | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const ProfileInformationScreen: React.FC<
  ProfileInformationScreenProps
> = ({ onBack }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const profile = useUserStore(state => state.profile);
  const { cooking_methods, work_types, diet_types } = useMetaChoices();
  const [activeEditSection, setActiveEditSection] =
    useState<ProfileEditSection | null>(null);

  const locale =
    i18n.resolvedLanguage === 'fr'
      ? 'fr-FR'
      : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';
  const currentPregnancyWeek =
    getCurrentPregnancyWeek(
      profile.pregnancyWeek,
      profile.pregnancyWeekSetDate,
    ) || 1;
  const pregnancyNumberLabels: Record<string, string> = {
    first: t('intro.step10pregnancy_first'),
    second: t('intro.step10pregnancy_second'),
    third: t('intro.step10pregnancy_third'),
    moreThan3: t('intro.step10pregnancy_more'),
  };
  const timeSpentLabels: Record<string, string> = {
    indoors: t('profile.mostly_indoors'),
    outdoors: t('profile.mostly_outdoors'),
    both: t('profile.both_equally'),
  };
  const timeOfDayLabels: Record<string, string> = {
    mornings: t('profile.morning_hours'),
    afternoon: t('profile.midday_afternoon'),
    evening: t('profile.evening'),
    change: t('profile.changes_daily'),
  };
  const ventilationLabels: Record<string, string> = {
    good: t('profile.ventilation_good_short'),
    moderate: t('profile.ventilation_moderate_short'),
    poor: t('profile.ventilation_poor_short'),
  };

  const birthdaySummary = formatBirthday(profile.birthday, locale) || '-';
  const timezoneSummary = profile.timezone || '-';
  const pregnancySummary = joinSummary(
    t('profile.week_value', { week: currentPregnancyWeek }),
    profile.pregnancyNumber &&
      (pregnancyNumberLabels[profile.pregnancyNumber] ||
        profile.pregnancyNumber),
  );
  const dayPatternSummary = joinSummary(
    profile.timeSpent &&
      (timeSpentLabels[profile.timeSpent] || profile.timeSpent),
    profile.timeOfDay &&
      (timeOfDayLabels[profile.timeOfDay] || profile.timeOfDay),
  );
  const homeEnvironmentSummary = joinSummary(
    cooking_methods.find(method => method.value === profile.cookingMethod)
      ?.label || profile.cookingMethod,
    profile.ventilation &&
      (ventilationLabels[profile.ventilation] || profile.ventilation),
  );
  const sleepActivitySummary = joinSummary(
    profile.sleepHours
      ? t('profile.sleep_summary_value', { count: profile.sleepHours })
      : undefined,
    profile.activeHours
      ? t('profile.activity_summary_value', { count: profile.activeHours })
      : undefined,
  );
  const workDietSummary = joinSummary(
    work_types.find(work => work.value === profile.workType)?.label ||
      profile.workType,
    diet_types.find(diet => diet.value === profile.diet)?.label || profile.diet,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#fff',
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing('md'),
          paddingTop: 50,
          paddingBottom: spacing('md'),
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 3,
        },
        headerTitle: {
          fontSize: responsiveUtils.getFixedFontSize(18),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
        },
        content: {
          flex: 1,
          paddingHorizontal: spacing('md'),
        },
        contentContainer: {
          paddingTop: spacing('lg'),
          paddingBottom: spacing('xl') * 2,
        },
        section: {
          marginBottom: spacing('lg'),
        },
        sectionTitle: {
          fontSize: responsiveUtils.getFixedFontSize(15),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textSecondary,
          marginBottom: spacing('sm'),
        },
        card: {
          backgroundColor: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
        row: {
          minHeight: 70,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
          paddingVertical: spacing('sm'),
        },
        rowText: {
          flex: 1,
          minWidth: 0,
        },
        rowTitle: {
          fontSize: responsiveUtils.getFixedFontSize(15),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
        },
        rowValue: {
          fontSize: responsiveUtils.getFixedFontSize(13),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          lineHeight: 18,
          marginTop: 3,
        },
        chevron: {
          marginLeft: spacing('md'),
        },
        divider: {
          height: 1,
          backgroundColor: theme.colors.neutral200,
          marginLeft: spacing('md'),
        },
      }),
    [theme],
  );

  const renderRow = (
    title: string,
    value: string,
    section: ProfileEditSection,
    showDivider = true,
  ) => (
    <React.Fragment key={section}>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => setActiveEditSection(section)}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value}`}
      >
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} allowFontScaling={false}>
            {title}
          </Text>
          <Text
            style={styles.rowValue}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {value}
          </Text>
        </View>
        <FontAwesomeIcon
          icon={faChevronRight as any}
          size={14}
          color={theme.colors.textSecondary}
          style={styles.chevron}
        />
      </TouchableOpacity>
      {showDivider ? <View style={styles.divider} /> : null}
    </React.Fragment>
  );

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          {t('profile.personal_information')}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>
            {t('profile.edit_personal_details')}
          </Text>
          <View style={styles.card}>
            {renderRow(t('profile.birthday'), birthdaySummary, 'birthday')}
            {renderRow(
              t('profile.time_zone'),
              timezoneSummary,
              'timezone',
              false,
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>
            {t('profile.edit_pregnancy_details')}
          </Text>
          <View style={styles.card}>
            {renderRow(
              t('profile.pregnancy_details'),
              pregnancySummary,
              'pregnancy',
              false,
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>
            {t('profile.edit_daily_routine')}
          </Text>
          <View style={styles.card}>
            {renderRow(
              t('profile.day_pattern'),
              dayPatternSummary,
              'dayPattern',
            )}
            {renderRow(
              t('profile.home_environment'),
              homeEnvironmentSummary,
              'homeEnvironment',
            )}
            {renderRow(
              t('profile.sleep_activity'),
              sleepActivitySummary,
              'sleepActivity',
            )}
            {renderRow(
              t('profile.work_diet'),
              workDietSummary,
              'workDiet',
              false,
            )}
          </View>
        </View>
      </ScrollView>

      <ProfileEditSheet
        visible={activeEditSection !== null}
        section={activeEditSection}
        onClose={() => setActiveEditSection(null)}
      />
    </SafeAreaView>
  );
};
