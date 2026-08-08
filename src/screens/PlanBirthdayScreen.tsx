import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faChevronRight, faEdit } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useTheme, spacing, radius } from '../theme';
import { BackButton, Button, FixedButtonContainer } from '../components/ui';
import { ms, fs, vs, FIXED_BUTTON_AREA_HEIGHT } from '../utils/responsive';
import { responsiveUtils } from '../utils/responsiveUtils';
import { Image } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { useTranslation } from 'react-i18next';

interface PlanBirthdayScreenProps {
  onBack?: () => void;
  onConfirm?: (date: Date) => void;
}

export const PlanBirthdayScreen: React.FC<PlanBirthdayScreenProps> = ({ onBack, onConfirm }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'fr'
    ? 'fr-FR'
    : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';
  const { profile } = useUserStore();

  const currentWeek = getCurrentPregnancyWeek(profile.pregnancyWeek, profile.pregnancyWeekSetDate) || 1;
  const weeksRemaining = Math.max(0, 40 - currentWeek);
  const estimatedDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weeksRemaining * 7);
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(estimatedDueDate);
  const selectedDateRef = useRef<Date>(estimatedDueDate);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState<Date>(estimatedDueDate);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateMarkedDates = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setMarkedDates({
      [dateStr]: {
        selected: true,
        selectedColor: theme.colors.orange500,
        customStyles: {
          container: {
            borderRadius: ms(20),
            backgroundColor: theme.colors.orange500,
            width: ms(40),
            height: ms(40),
            justifyContent: 'center',
            alignItems: 'center',
          },
          text: {
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.medium,
          },
        },
      },
    });
  };

  // Initialize marked dates
  React.useEffect(() => {
    updateMarkedDates(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDayPress = (day: DateData) => {
    const [year, month, dayNum] = day.dateString.split('-').map(Number);
    const newDate = new Date(year, month - 1, dayNum);
    setSelectedDate(newDate);
    selectedDateRef.current = newDate;
    updateMarkedDates(newDate);
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const formatSelectedDate = (date: Date): string =>
    date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  React.useEffect(() => {
    const monthDates = Array.from(
      { length: 12 },
      (_, month) => new Date(2024, month, 1),
    );
    const dayDates = Array.from(
      { length: 7 },
      (_, day) => new Date(2024, 0, 7 + day),
    );
    LocaleConfig.locales[locale] = {
      monthNames: monthDates.map(date =>
        date.toLocaleDateString(locale, { month: 'long' }),
      ),
      monthNamesShort: monthDates.map(date =>
        date.toLocaleDateString(locale, { month: 'short' }),
      ),
      dayNames: dayDates.map(date =>
        date.toLocaleDateString(locale, { weekday: 'long' }),
      ),
      dayNamesShort: dayDates.map(date =>
        date.toLocaleDateString(locale, { weekday: 'short' }),
      ),
      today: t('symptoms.today'),
    };
    LocaleConfig.defaultLocale = locale;
  }, [locale, t]);

  const customTheme = {
    backgroundColor: theme.colors.background,
    calendarBackground: theme.colors.background,
    textSectionTitleColor: theme.colors.textSecondary,
    selectedDayBackgroundColor: theme.colors.orange500,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: theme.colors.textPrimary,
    dayTextColor: theme.colors.textPrimary,
    textDisabledColor: theme.colors.neutral400,
    dotColor: theme.colors.orange500,
    selectedDotColor: '#FFFFFF',
    arrowColor: theme.colors.orange500,
    monthTextColor: theme.colors.textPrimary,
    indicatorColor: theme.colors.orange500,
    textDayFontFamily: theme.typography.fontFamily.regular,
    textMonthFontFamily: theme.typography.fontFamily.medium,
    textDayHeaderFontFamily: theme.typography.fontFamily.medium,
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
    'stylesheet.calendar.header': {
      monthText: {
        fontSize: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
      },
      week: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
    },
    'stylesheet.day.basic': {
      today: {
        backgroundColor: 'transparent',
      },
      todayText: {
        color: theme.colors.textPrimary,
      },
    },
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF8F3',
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
      color: theme.colors.orange500,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
    },
    calendarContainer: {
        display:'flex',
        flexDirection:'column',
        backgroundColor:theme.colors.orange100,
        width:'100%',
        marginLeft:16,
        marginRight:16,
        alignSelf:'center',
        marginTop:16,
        borderRadius:12
    },
    calendarCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: spacing('md'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      margin:16
    },
    customHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing('sm'),
      paddingHorizontal: spacing('sm'),
      marginBottom: spacing('sm'),
    },
    monthYearText: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    arrowsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('md'),
    },
    arrowButton: {
      padding: spacing('sm'),
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: ms(36),
      minHeight: ms(36),
    },
    selectedDateSection: {
      alignItems: 'center',
      marginTop: 16,
    },
    selectedDateLabel: {
      fontSize: responsiveUtils.getBadgeFontSize(),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    selectedDateBox: {
      backgroundColor: '#fff',
      borderRadius: 30,
      paddingVertical: 12,
      paddingHorizontal: 18,
      marginBottom:16,
      marginTop:16
    },
    selectedDateText: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
      textAlign: 'center',
    },
    footerText: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing('lg'),
      lineHeight: responsiveUtils.getFixedLineHeight(14, 22),
    },
    scrollContent: {
      paddingBottom: FIXED_BUTTON_AREA_HEIGHT + vs(40),
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.orange200,
      width:'90%',
      alignSelf:'center'
    },
    confirmedCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      marginTop: spacing('xl'),
      width:'100%',
      marginHorizontal:16,
      padding: spacing('lg'),
      shadowColor: '#000',
      alignSelf:'center',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    confirmedCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing('lg'),
    },
    confirmedCardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('md'),
    },
    iconCircle: {
      width: ms(48),
      height: ms(48),
      borderRadius: ms(24),
      backgroundColor: theme.colors.orange100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    birthdayImage: {
      width: ms(40),
      height: ms(40),
      resizeMode: 'contain',
    },
    confirmedCardTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    editIconCircle: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(24),
      backgroundColor: theme.colors.orange100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmedDateBox: {
      backgroundColor: '#FFF0E5',
      borderRadius: 30,
      paddingVertical: vs(14),
      paddingHorizontal: ms(32),
      alignItems: 'center',
    },
    confirmedDateText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
      textAlign: 'center',
    },
    loadingOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      backgroundColor: '#fff',
      borderRadius: ms(12),
      padding: ms(24),
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: ms(16),
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>{t('date_picker.birthday_title')}</Text>
      </View>

      {isConfirmed ? (
        // Confirmed Card View
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing('xl') }}
        >
          <View style={styles.confirmedCard}>
            {/* Header with icon, title, and edit button */}
            <View style={styles.confirmedCardHeader}>
              <View style={styles.confirmedCardHeaderLeft}>
                <View style={styles.iconCircle}>
                  <Image
                    source={require('../assets/images/birthdayImage.png')}
                    style={styles.birthdayImage}
                  />
                </View>
                <Text style={styles.confirmedCardTitle} allowFontScaling={false}>{t('date_picker.selected_date')}</Text>
              </View>
              <TouchableOpacity
                style={styles.editIconCircle}
                onPress={() => setIsConfirmed(false)}
                activeOpacity={0.7}
              >
                <FontAwesomeIcon
                  icon={faEdit as IconProp}
                  size={ms(16)}
                  color={theme.colors.orange500}
                />
              </TouchableOpacity>
            </View>

            {/* Date Display */}
            <View style={styles.confirmedDateBox}>
              <Text style={styles.confirmedDateText} allowFontScaling={false}>{formatSelectedDate(selectedDate)}</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        // Calendar View
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.calendarContainer}>
            <View style={styles.calendarCard}>
              {/* Custom header with month/year and arrows */}
              <View style={styles.customHeader}>
                <Text style={styles.monthYearText} allowFontScaling={false}>
                  {currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                </Text>
                <View style={styles.arrowsContainer}>
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={goToPreviousMonth}
                    activeOpacity={0.7}
                  >
                    <FontAwesomeIcon
                      icon={faChevronLeft as IconProp}
                      size={ms(16)}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={goToNextMonth}
                    activeOpacity={0.7}
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight as IconProp}
                      size={ms(16)}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Calendar
                key={`calendar-${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
                current={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                theme={customTheme}
                enableSwipeMonths={false}
                hideExtraDays={true}
                firstDay={0}
                showWeekNumbers={false}
                monthFormat={'MMMM yyyy'}
                hideArrows={true}
                renderHeader={() => <View style={{ height: 0 }} />}
              />
            </View>

            <View style={styles.divider} />

            {/* Selected Date Display */}
            <View style={styles.selectedDateSection}>
              <Text style={styles.selectedDateLabel} allowFontScaling={false}>{t('date_picker.selected_date')}</Text>
              <View style={styles.selectedDateBox}>
                <Text style={styles.selectedDateText} allowFontScaling={false}>{formatSelectedDate(selectedDate)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.footerText} allowFontScaling={false}>
            {t('date_picker.birthday_message')}
          </Text>
        </ScrollView>
      )}

      {!isConfirmed && (
        <FixedButtonContainer>
          <Button
            title={t('date_picker.confirm_birth_date')}
            onPress={() => {
              setIsLoading(true);
              // Call onConfirm callback
              onConfirm?.(selectedDate);
              // After a short delay, show the confirmed card
              setTimeout(() => {
                setIsConfirmed(true);
                setIsLoading(false);
              }, 800);
            }}
          />
        </FixedButtonContainer>
      )}

      {/* Loading Modal */}
      <Modal visible={isLoading} transparent={true} animationType="fade" onRequestClose={() => {}}>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.orange500} />
            <Text style={styles.loadingText} allowFontScaling={false}>{t('common.loading')}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
