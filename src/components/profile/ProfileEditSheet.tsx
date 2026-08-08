import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faUser } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { spacing, radius, useTheme } from '../../theme';
import {
  BottomSheet,
  BottomSheetOption,
  Button,
  DatePicker,
  Dropdown,
  HeightWeightPicker,
  Input,
} from '../ui';
import { useMetaChoices } from '../../hooks/useMetaChoices';
import { useUserStore } from '../../store/useUserStore';
import { ProfileService } from '../../services/api/ProfileService';
import { LifestyleService } from '../../services/api/LifestyleService';
import { LanguageService } from '../../services/api/LanguageService';
import { DEV_LOCAL_SESSION } from '../../config/dev';
import { formatLocalDate } from '../../utils/dateUtils';
import { getTimezoneList } from '../../utils/timezoneUtils';
import {
  buildProfileEditPayloads,
  getProfileEditValues,
  type ProfileEditValues,
} from '../../utils/profileEdit';
import { ms, vs } from '../../utils/responsive';

interface ProfileEditSheetProps {
  visible: boolean;
  section: ProfileEditSection | null;
  onClose: () => void;
}

export type ProfileEditSection =
  | 'identity'
  | 'location'
  | 'birthday'
  | 'heightWeight'
  | 'language'
  | 'timezone'
  | 'pregnancy'
  | 'dayPattern'
  | 'homeEnvironment'
  | 'sleepActivity'
  | 'workDiet';

type SelectionField =
  | 'language'
  | 'country'
  | 'area'
  | 'timezone'
  | 'pregnancyWeek'
  | 'pregnancyNumber'
  | 'timeSpent'
  | 'timeOfDay'
  | 'cookingMethod'
  | 'ventilation'
  | 'sleepHours'
  | 'activeHours'
  | 'workType'
  | 'diet';

interface ChoiceOption {
  value: string | number;
  label: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseLocalDate = (value: string | null): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const ProfileEditSheet: React.FC<ProfileEditSheetProps> = ({
  visible,
  section,
  onClose,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { countries, languages, cooking_methods, work_types, diet_types } =
    useMetaChoices();
  const store = useUserStore();
  const { profile } = store;
  const [draft, setDraft] = useState<ProfileEditValues>(() =>
    getProfileEditValues(profile),
  );
  const [activeChoiceField, setActiveChoiceField] =
    useState<SelectionField | null>(null);
  const [isHeightWeightPickerVisible, setIsHeightWeightPickerVisible] =
    useState(false);
  const [isBirthdayPickerVisible, setIsBirthdayPickerVisible] = useState(false);

  const locale =
    i18n.resolvedLanguage === 'fr'
      ? 'fr-FR'
      : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';

  useEffect(() => {
    if (!visible) return;
    setDraft(getProfileEditValues(useUserStore.getState().profile));
    setActiveChoiceField(null);
    setIsHeightWeightPickerVisible(false);
    setIsBirthdayPickerVisible(false);
  }, [section, visible]);

  const updateDraft = <K extends keyof ProfileEditValues>(
    key: K,
    value: ProfileEditValues[K],
  ) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const timezoneOptions = useMemo<ChoiceOption[]>(() => {
    const timezones = new Set(getTimezoneList());
    if (draft.timezone) timezones.add(draft.timezone);
    return Array.from(timezones)
      .sort()
      .map(timezone => ({ value: timezone, label: timezone }));
  }, [draft.timezone]);

  const choiceOptions = useMemo<Record<SelectionField, ChoiceOption[]>>(
    () => ({
      language: languages,
      country: countries,
      area: [
        { value: 'urban', label: t('profile.urban') },
        { value: 'peri-urban', label: t('profile.peri_urban') },
        { value: 'rural', label: t('profile.rural') },
      ],
      timezone: timezoneOptions,
      pregnancyWeek: Array.from({ length: 40 }, (_, index) => ({
        value: index + 1,
        label: t('profile.week_value', { week: index + 1 }),
      })),
      pregnancyNumber: [
        { value: 'first', label: t('intro.step10pregnancy_first') },
        { value: 'second', label: t('intro.step10pregnancy_second') },
        { value: 'third', label: t('intro.step10pregnancy_third') },
        { value: 'moreThan3', label: t('intro.step10pregnancy_more') },
      ],
      timeSpent: [
        { value: 'indoors', label: t('profile.mostly_indoors') },
        { value: 'outdoors', label: t('profile.mostly_outdoors') },
        { value: 'both', label: t('profile.both_equally') },
      ],
      timeOfDay: [
        { value: 'mornings', label: t('profile.morning_hours') },
        { value: 'afternoon', label: t('profile.midday_afternoon') },
        { value: 'evening', label: t('profile.evening') },
        { value: 'change', label: t('profile.changes_daily') },
      ],
      cookingMethod: cooking_methods,
      ventilation: [
        { value: 'good', label: t('profile.ventilation_good') },
        { value: 'moderate', label: t('profile.ventilation_moderate') },
        { value: 'poor', label: t('profile.ventilation_poor') },
      ],
      sleepHours: Array.from({ length: 24 }, (_, index) => ({
        value: index + 1,
        label: t('profile.hours_value', { count: index + 1 }),
      })),
      activeHours: Array.from({ length: 24 }, (_, index) => ({
        value: index + 1,
        label: t('profile.hours_value', { count: index + 1 }),
      })),
      workType: work_types,
      diet: diet_types,
    }),
    [
      cooking_methods,
      countries,
      diet_types,
      languages,
      t,
      timezoneOptions,
      work_types,
    ],
  );

  const fieldTitles: Record<SelectionField, string> = {
    language: t('profile.language'),
    country: t('profile.country'),
    area: t('profile.area'),
    timezone: t('profile.time_zone'),
    pregnancyWeek: t('profile.pregnancy_week'),
    pregnancyNumber: t('profile.pregnancy_number'),
    timeSpent: t('profile.time_spent'),
    timeOfDay: t('profile.outdoor_time'),
    cookingMethod: t('profile.cooking_method'),
    ventilation: t('profile.ventilation'),
    sleepHours: t('profile.sleep_hours'),
    activeHours: t('profile.active_hours'),
    workType: t('profile.work_type'),
    diet: t('profile.diet_type'),
  };

  const fieldPlaceholders: Record<SelectionField, string> = {
    language: t('profile.select_language'),
    country: t('profile.select_country'),
    area: t('profile.select_area_type'),
    timezone: t('profile.select_time_zone'),
    pregnancyWeek: t('profile.select_pregnancy_week'),
    pregnancyNumber: t('profile.select_pregnancy_number'),
    timeSpent: t('profile.select_time_spent'),
    timeOfDay: t('profile.select_outdoor_time'),
    cookingMethod: t('profile.select_cooking_method'),
    ventilation: t('profile.select_ventilation'),
    sleepHours: t('profile.select_sleep_hours'),
    activeHours: t('profile.select_active_hours'),
    workType: t('profile.select_work_type'),
    diet: t('profile.select_diet_type'),
  };

  const selectedLabel = (field: SelectionField): string | null => {
    const value = draft[field];
    if (field === 'ventilation' && typeof value === 'string') {
      const compactVentilationLabels: Record<string, string> = {
        good: t('profile.ventilation_good_short'),
        moderate: t('profile.ventilation_moderate_short'),
        poor: t('profile.ventilation_poor_short'),
      };
      return compactVentilationLabels[value] || value;
    }
    return (
      choiceOptions[field].find(option => option.value === value)?.label ??
      (value === null ? null : String(value))
    );
  };

  const renderDropdown = (field: SelectionField) => (
    <View key={field} style={styles.fieldContainer}>
      <Text style={styles.fieldTitle} allowFontScaling={false}>
        {fieldTitles[field]}
      </Text>
      <Dropdown
        label={fieldPlaceholders[field]}
        value={selectedLabel(field)}
        onPress={() => setActiveChoiceField(field)}
      />
    </View>
  );

  const birthdayDate = parseLocalDate(draft.birthday);
  const formattedBirthday = birthdayDate
    ? birthdayDate.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;
  const heightWeightValue =
    draft.height && draft.weight
      ? `${draft.height} cm  •  ${draft.weight} kg`
      : null;

  const editSectionTitles: Record<ProfileEditSection, string> = {
    identity: t('profile.account_details'),
    location: t('profile.location_details'),
    birthday: t('profile.birthday'),
    heightWeight: t('profile.height_weight'),
    language: t('profile.language'),
    timezone: t('profile.time_zone'),
    pregnancy: t('profile.edit_pregnancy_details'),
    dayPattern: t('profile.day_pattern'),
    homeEnvironment: t('profile.home_environment'),
    sleepActivity: t('profile.sleep_activity'),
    workDiet: t('profile.work_diet'),
  };

  const normalizedDraft: ProfileEditValues = {
    ...draft,
    name: draft.name?.trim() || null,
    email: draft.email?.trim() || null,
  };
  const isFormValid =
    section === 'identity'
      ? Boolean(
          normalizedDraft.name &&
            normalizedDraft.email &&
            EMAIL_PATTERN.test(normalizedDraft.email),
        )
      : section === 'pregnancy'
      ? Boolean(normalizedDraft.pregnancyWeek)
      : section !== null;

  const handleSave = () => {
    if (!isFormValid) return;

    const current = getProfileEditValues(profile);
    const isPregnancyWeekConfirmation = section === 'pregnancy';
    const payloads = buildProfileEditPayloads(current, normalizedDraft, {
      forcePregnancyWeek: isPregnancyWeekConfirmation,
    });

    if (normalizedDraft.name !== current.name && normalizedDraft.name) {
      store.setName(normalizedDraft.name);
    }
    if (normalizedDraft.email !== current.email && normalizedDraft.email) {
      store.setEmail(normalizedDraft.email);
    }
    if (normalizedDraft.birthday !== current.birthday) {
      store.setBirthday(parseLocalDate(normalizedDraft.birthday));
    }
    if (normalizedDraft.height !== current.height) {
      store.setHeight(normalizedDraft.height);
    }
    if (normalizedDraft.weight !== current.weight) {
      store.setWeight(normalizedDraft.weight);
    }
    if (
      normalizedDraft.language !== current.language &&
      normalizedDraft.language
    ) {
      store.setLanguage(normalizedDraft.language);
    }
    if (
      normalizedDraft.country !== current.country &&
      normalizedDraft.country
    ) {
      store.setCountry(normalizedDraft.country);
    }
    if (normalizedDraft.area !== current.area && normalizedDraft.area) {
      store.setArea(normalizedDraft.area);
    }
    if (normalizedDraft.timezone !== current.timezone) {
      store.setTimezone(normalizedDraft.timezone);
    }
    if (
      normalizedDraft.pregnancyWeek !== current.pregnancyWeek ||
      isPregnancyWeekConfirmation
    ) {
      store.setPregnancyWeek(normalizedDraft.pregnancyWeek);
    }
    if (normalizedDraft.pregnancyNumber !== current.pregnancyNumber) {
      store.setPregnancyNumber(normalizedDraft.pregnancyNumber);
    }
    if (normalizedDraft.timeSpent !== current.timeSpent) {
      store.setTimeSpent(normalizedDraft.timeSpent);
    }
    if (normalizedDraft.timeOfDay !== current.timeOfDay) {
      store.setTimeOfDay(normalizedDraft.timeOfDay);
    }
    if (normalizedDraft.cookingMethod !== current.cookingMethod) {
      store.setCookingMethod(normalizedDraft.cookingMethod);
    }
    if (normalizedDraft.ventilation !== current.ventilation) {
      store.setVentilation(normalizedDraft.ventilation);
    }
    if (normalizedDraft.sleepHours !== current.sleepHours) {
      store.setSleepHours(normalizedDraft.sleepHours);
    }
    if (normalizedDraft.activeHours !== current.activeHours) {
      store.setActiveHours(normalizedDraft.activeHours);
    }
    if (normalizedDraft.workType !== current.workType) {
      store.setWorkType(normalizedDraft.workType);
    }
    if (normalizedDraft.diet !== current.diet) {
      store.setDiet(normalizedDraft.diet);
    }

    onClose();

    if (DEV_LOCAL_SESSION) return;

    const requests: Promise<unknown>[] = [];
    if (Object.keys(payloads.profile).length > 0) {
      requests.push(ProfileService.patchProfile(payloads.profile));
    }
    // Email is sent separately so an account-level email restriction cannot
    // prevent the remaining profile fields from being saved.
    if (Object.keys(payloads.email).length > 0) {
      requests.push(ProfileService.patchProfile(payloads.email));
    }
    if (Object.keys(payloads.lifestyle).length > 0) {
      requests.push(LifestyleService.patchLifestyle(payloads.lifestyle));
    }
    if (payloads.languageChanged && normalizedDraft.language) {
      requests.push(LanguageService.setLanguage(normalizedDraft.language));
    }
    if (requests.length > 0) Promise.allSettled(requests);
  };

  const renderBirthdayField = () => (
    <>
      <Text style={styles.fieldTitle} allowFontScaling={false}>
        {t('profile.birthday')}
      </Text>
      <TouchableOpacity
        style={styles.pickerWrapper}
        onPress={() => setIsBirthdayPickerVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.pickerShadow} />
        <View style={styles.picker}>
          <FontAwesomeIcon
            icon={faCalendar as any}
            size={ms(18)}
            color={theme.colors.neutral600}
          />
          <Text
            style={[
              styles.pickerText,
              {
                color: formattedBirthday
                  ? theme.colors.textPrimary
                  : theme.colors.neutral400,
              },
            ]}
            allowFontScaling={false}
          >
            {formattedBirthday ?? t('profile.birthday_placeholder')}
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );

  const renderHeightWeightField = () => (
    <>
      <Text style={styles.fieldTitle} allowFontScaling={false}>
        {t('profile.height_weight')}
      </Text>
      <TouchableOpacity
        style={styles.pickerWrapper}
        onPress={() => setIsHeightWeightPickerVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.pickerShadow} />
        <View style={styles.picker}>
          <FontAwesomeIcon
            icon={faUser as any}
            size={ms(18)}
            color={theme.colors.neutral600}
          />
          <Text
            style={[
              styles.pickerText,
              {
                color: heightWeightValue
                  ? theme.colors.textPrimary
                  : theme.colors.neutral400,
              },
            ]}
            allowFontScaling={false}
          >
            {heightWeightValue ?? t('profile.select_height_weight')}
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );

  const renderSectionFields = () => {
    switch (section) {
      case 'identity':
        return (
          <>
            <Text style={styles.fieldTitle} allowFontScaling={false}>
              {t('profile.name')}
            </Text>
            <Input
              title=""
              placeholder={t('profile.enter_name')}
              type="text"
              value={draft.name ?? ''}
              onChangeText={value => updateDraft('name', value)}
            />
            <View style={styles.inputSpacing} />
            <Text style={styles.fieldTitle} allowFontScaling={false}>
              {t('profile.email')}
            </Text>
            <Input
              title=""
              placeholder={t('intro.step02_email_placeholder')}
              type="email"
              value={draft.email ?? ''}
              onChangeText={value => updateDraft('email', value)}
            />
          </>
        );
      case 'location':
        return (
          <>
            {renderDropdown('country')}
            {renderDropdown('area')}
          </>
        );
      case 'birthday':
        return renderBirthdayField();
      case 'heightWeight':
        return renderHeightWeightField();
      case 'language':
        return renderDropdown('language');
      case 'timezone':
        return renderDropdown('timezone');
      case 'pregnancy':
        return (
          <>
            {renderDropdown('pregnancyWeek')}
            {renderDropdown('pregnancyNumber')}
          </>
        );
      case 'dayPattern':
        return (
          <>
            {renderDropdown('timeSpent')}
            {renderDropdown('timeOfDay')}
          </>
        );
      case 'homeEnvironment':
        return (
          <>
            {renderDropdown('cookingMethod')}
            {renderDropdown('ventilation')}
          </>
        );
      case 'sleepActivity':
        return (
          <>
            {renderDropdown('sleepHours')}
            {renderDropdown('activeHours')}
          </>
        );
      case 'workDiet':
        return (
          <>
            {renderDropdown('workType')}
            {renderDropdown('diet')}
          </>
        );
      default:
        return null;
    }
  };

  const activeOptions = activeChoiceField
    ? choiceOptions[activeChoiceField]
    : [];
  const selectedOptionIndex = activeChoiceField
    ? activeOptions.findIndex(
        option => option.value === draft[activeChoiceField],
      )
    : -1;
  const initialOptionsOffset = Math.max(
    0,
    (selectedOptionIndex - 1) * (vs(50) + spacing('md')),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sheetScroll: {
          maxHeight: SCREEN_HEIGHT * 0.82,
        },
        sheetContent: {
          paddingBottom: insets.bottom + spacing('xl'),
        },
        fieldContainer: {
          width: '100%',
        },
        fieldTitle: {
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          marginBottom: spacing('sm'),
        },
        inputSpacing: {
          height: spacing('md'),
        },
        pickerWrapper: {
          position: 'relative',
          width: '100%',
          marginBottom: spacing('md'),
        },
        pickerShadow: {
          position: 'absolute',
          height: vs(54),
          borderRadius: radius('md'),
          backgroundColor: theme.colors.neutral300,
          top: 4,
          left: 0,
          right: 0,
        },
        picker: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
          height: vs(54),
          backgroundColor: theme.colors.background,
          borderRadius: radius('md'),
          borderWidth: 1,
          borderColor: theme.colors.neutral300,
        },
        pickerText: {
          flex: 1,
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.regular,
          marginLeft: spacing('sm'),
        },
        saveContainer: {
          marginTop: spacing('lg'),
        },
        optionsScroll: {
          maxHeight: SCREEN_HEIGHT * 0.65,
        },
        optionsContent: {
          paddingBottom: insets.bottom + spacing('lg'),
        },
      }),
    [insets.bottom, theme],
  );

  return (
    <>
      <BottomSheet
        visible={visible && section !== null}
        onClose={onClose}
        showHandle
        title={section ? editSectionTitles[section] : undefined}
      >
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderSectionFields()}

          <View style={styles.saveContainer}>
            <Button
              title={t('common.save')}
              onPress={handleSave}
              disabled={!isFormValid}
            />
          </View>
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={activeChoiceField !== null}
        onClose={() => setActiveChoiceField(null)}
        title={activeChoiceField ? fieldTitles[activeChoiceField] : undefined}
      >
        <ScrollView
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContent}
          contentOffset={{ x: 0, y: initialOptionsOffset }}
          showsVerticalScrollIndicator={false}
        >
          {activeOptions.map(option => (
            <BottomSheetOption
              key={String(option.value)}
              label={option.label}
              selected={
                activeChoiceField !== null &&
                draft[activeChoiceField] === option.value
              }
              onPress={() => {
                if (!activeChoiceField) return;
                setDraft(current => ({
                  ...current,
                  [activeChoiceField]: option.value,
                }));
                setActiveChoiceField(null);
              }}
            />
          ))}
        </ScrollView>
      </BottomSheet>

      <HeightWeightPicker
        visible={isHeightWeightPickerVisible}
        onClose={() => setIsHeightWeightPickerVisible(false)}
        onConfirm={(height, weight) => {
          updateDraft('height', height);
          updateDraft('weight', weight);
          setIsHeightWeightPickerVisible(false);
        }}
        initialHeight={draft.height ?? 165}
        initialWeight={draft.weight ?? 65}
      />

      <DatePicker
        visible={isBirthdayPickerVisible}
        onClose={() => setIsBirthdayPickerVisible(false)}
        onConfirm={date => {
          updateDraft('birthday', formatLocalDate(date));
          setIsBirthdayPickerVisible(false);
        }}
        initialDate={birthdayDate ?? undefined}
      />
    </>
  );
};
