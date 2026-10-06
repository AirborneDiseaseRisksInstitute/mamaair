import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme, spacing } from '../theme';
import { Button, Input, DatePicker, HeightWeightPicker, WeekCycleView } from '../components/ui';
import { useTranslation } from 'react-i18next';

export const ComponentShowcaseScreen: React.FC = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'fr'
    ? 'fr-FR'
    : i18n.resolvedLanguage === 'sw'
    ? 'sw-KE'
    : 'en-US';
  const [buttonPressCount, setButtonPressCount] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [heightWeightPickerVisible, setHeightWeightPickerVisible] = useState(false);
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [weekCycleReversed, setWeekCycleReversed] = useState(false);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {t('showcase.title')}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            {t('showcase.subtitle')}
          </Text>
        </View>

        {/* Button Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {t('showcase.button_section')}
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            {t('showcase.button_description')}
          </Text>

          <View style={styles.componentContainer}>
            <Button
              title={t('showcase.normal_button')}
              onPress={() => setButtonPressCount((prev) => prev + 1)}
            />

            <View style={styles.spacing} />

            <Button
              title={t('showcase.disabled_button')}
              onPress={() => {}}
              disabled={true}
            />

            {buttonPressCount > 0 && (
              <View style={styles.feedbackContainer}>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: theme.colors.orange500 },
                  ]}
                 allowFontScaling={false}>
                  {t('showcase.button_pressed', { count: buttonPressCount })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Input Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {t('showcase.input_section')}
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            {t('showcase.input_description')}
          </Text>

          <View style={styles.componentContainer}>
            <Input
              title={t('auth.email')}
              placeholder={t('auth.email_placeholder')}
              type="email"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              title={t('auth.password')}
              placeholder={t('auth.password_placeholder')}
              type="password"
              value={password}
              onChangeText={setPassword}
            />

            <Input
              title={t('intro.step02_name')}
              placeholder={t('intro.step02_name_placeholder')}
              type="text"
            />
          </View>
        </View>

        {/* DatePicker Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {t('showcase.date_picker_section')}
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            {t('showcase.date_picker_description')}
          </Text>

          <View style={styles.componentContainer}>
            <Button
              title={t('showcase.open_date_picker')}
              onPress={() => setDatePickerVisible(true)}
            />

            {selectedDate && (
              <View style={styles.feedbackContainer}>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: theme.colors.orange500 },
                  ]}
                 allowFontScaling={false}>
                  {t('showcase.selected_date', {
                    date: selectedDate.toLocaleDateString(locale),
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* HeightWeightPicker Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {t('showcase.height_weight_section')}
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            {t('showcase.height_weight_description')}
          </Text>

          <View style={styles.componentContainer}>
            <Button
              title={t('showcase.open_height_weight_picker')}
              onPress={() => setHeightWeightPickerVisible(true)}
            />

            {selectedHeight && selectedWeight && (
              <View style={styles.feedbackContainer}>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: theme.colors.orange500 },
                  ]}
                 allowFontScaling={false}>
                  {t('showcase.height_weight_value', {
                    height: selectedHeight,
                    weight: selectedWeight,
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* WeekCycleView Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {t('showcase.week_cycle_section')}
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            {t('showcase.week_cycle_description')}
          </Text>

          <View style={styles.componentContainer}>
            <View style={styles.weekCycleContainer}>
              <WeekCycleView
                reversed={weekCycleReversed}
                weekDays={[
                  'day_mon',
                  'day_tue',
                  'day_wed',
                  'day_thu',
                  'day_fri',
                  'day_sat',
                  'day_sun',
                ].map(day => ({
                  day: t(`common.${day}`),
                  icons: ['heart', 'basket', 'running'] as const,
                }))}
                circleIcons={[
                  { index: 0, iconPath: 'heartSystem.svg', percentage: 25 },
                  { index: 3, iconPath: 'brainSystem.svg', percentage: 50 },
                  { index: 6, iconPath: 'boneSystem.svg', percentage: 75 },
                ]}
              />
            </View>

            <View style={styles.spacing} />

            <Button
              title={t(
                weekCycleReversed
                  ? 'showcase.normal_layout'
                  : 'showcase.reversed_layout',
              )}
              onPress={() => setWeekCycleReversed(!weekCycleReversed)}
            />
          </View>
        </View>

        {/* Placeholder for future components */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
            {t('showcase.upcoming_components')}
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textTertiary }]}
           allowFontScaling={false}>
            {t('showcase.upcoming_description')}
          </Text>
        </View>
      </ScrollView>

      <DatePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(date) => {
          setSelectedDate(date);
          setDatePickerVisible(false);
        }}
        initialDate={selectedDate || undefined}
      />

      <HeightWeightPicker
        visible={heightWeightPickerVisible}
        onClose={() => setHeightWeightPickerVisible(false)}
        onConfirm={(height, weight) => {
          setSelectedHeight(height);
          setSelectedWeight(weight);
          setHeightWeightPickerVisible(false);
        }}
        initialHeight={selectedHeight || 170}
        initialWeight={selectedWeight || 60}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing('md'),
  },
  header: {
    marginBottom: spacing('xl'),
  },
  title: {
    fontSize: 28,
    fontFamily: 'MPLUSRounded1c-Bold',
    marginBottom: spacing('xs'),
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Regular',
  },
  section: {
    marginBottom: spacing('xl'),
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'MPLUSRounded1c-Bold',
    marginBottom: spacing('xs'),
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Regular',
    marginBottom: spacing('md'),
  },
  componentContainer: {
    marginTop: spacing('sm'),
    alignItems: 'center',
  },
  spacing: {
    height: spacing('md'),
  },
  feedbackContainer: {
    marginTop: spacing('md'),
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  weekCycleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing('lg'),
    borderRadius: spacing('md'),
  },
});
