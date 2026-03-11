import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { BottomSheet } from './BottomSheet';
import { useTheme, spacing, radius } from '../../theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ms, fs, vs } from '../../utils/responsive';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  title?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
  title = 'Select date',
}) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });
  const selectedDateRef = useRef<Date>(initialDate || new Date());
  const [markedDates, setMarkedDates] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  useEffect(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      setSelectedDate(date);
      selectedDateRef.current = date;
      setCurrentMonth(date);
      updateMarkedDates(date);
    } else {
      const today = new Date();
      setSelectedDate(today);
      selectedDateRef.current = today;
      setCurrentMonth(today);
      updateMarkedDates(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate]);

  useEffect(() => {
    updateMarkedDates(selectedDateRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const updateMarkedDates = (date: Date) => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

    const selectedYear = date.getFullYear();
    const selectedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const selectedDay = String(date.getDate()).padStart(2, '0');
    const selectedStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;

    const marked: any = {};

    if (todayStr !== selectedStr) {
      marked[todayStr] = {
        customStyles: {
          container: {
            borderWidth: 1,
            borderColor: theme.colors.orange500,
            borderRadius: ms(20),
            backgroundColor: 'transparent',
            width: ms(40),
            height: ms(40),
            justifyContent: 'center',
            alignItems: 'center',
          },
          text: {
            color: theme.colors.orange500,
            fontFamily: theme.typography.fontFamily.regular,
          },
        },
      };
    }

    marked[selectedStr] = {
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
    };

    setMarkedDates(marked);
  };

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
    updateMarkedDates(selectedDate);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    updateMarkedDates(selectedDate);
  };

  const handleMonthYearPress = () => {
    setShowMonthYearPicker(true);
  };

  const handleMonthYearSelect = (year: number, month: number) => {
    const newDate = new Date(year, month, 1);
    setCurrentMonth(newDate);
    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month
    ) {
      const day = Math.min(selectedDate.getDate(), new Date(year, month + 1, 0).getDate());
      const updatedDate = new Date(year, month, day);
      setSelectedDate(updatedDate);
      updateMarkedDates(updatedDate);
    } else {
      updateMarkedDates(selectedDate);
    }
    setShowMonthYearPicker(false);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const formatDate = (date: Date): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

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

  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle={true}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {title}
          </Text>
        </View>

        <View style={styles.selectedDateContainer}>
          <Text
            style={[styles.selectedDateText, { color: theme.colors.textPrimary }]}
            key={selectedDate.getTime()}
           allowFontScaling={false}>
            {formatDate(selectedDate)}
          </Text>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.customHeader}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={goToPreviousMonth}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faChevronLeft as IconProp}
                size={ms(18)}
                color={theme.colors.orange500}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthYearButton}
              onPress={handleMonthYearPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.monthYearText, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Text style={[styles.monthYearArrow, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
                ▼
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={goToNextMonth}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faChevronRight as IconProp}
                size={ms(18)}
                color={theme.colors.orange500}
              />
            </TouchableOpacity>
          </View>

          <Calendar
            key={`calendar-${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
            current={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(currentMonth.getDate()).padStart(2, '0')}`}
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

        {showMonthYearPicker && (
          <MonthYearPicker
            visible={showMonthYearPicker}
            currentDate={currentMonth}
            onSelect={handleMonthYearSelect}
            onClose={() => setShowMonthYearPicker(false)}
          />
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Cancel
            </Text>
          </TouchableOpacity>

          <View style={styles.okButtonContainer}>
            <View style={styles.okButtonWrapper}>
              <TouchableOpacity
                style={[
                  styles.okButton,
                  {
                    backgroundColor: theme.colors.orange500,
                    borderRadius: radius('md'),
                    shadowColor: theme.colors.orange900,
                  },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.okButtonText,
                    {
                      color: '#FFFFFF',
                      fontFamily: theme.typography.fontFamily.extraBold,
                      fontSize: 18,
                    },
                  ]}
                 allowFontScaling={false}>
                  Ok
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: spacing('lg'),
  },
  titleContainer: {
    paddingHorizontal: spacing('md'),
    paddingTop: spacing('sm'),
    paddingBottom: spacing('md'),
  },
  title: {
    fontSize: 20,
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  selectedDateContainer: {
    paddingHorizontal: spacing('md'),
    paddingBottom: spacing('lg'),
  },
  selectedDateText: {
    fontSize: 18,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  calendarContainer: {
    paddingHorizontal: spacing('md'),
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing('md'),
    paddingHorizontal: spacing('sm'),
  },
  arrowButton: {
    padding: spacing('sm'),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: ms(44),
    minHeight: ms(44),
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('xs'),
    paddingHorizontal: spacing('sm'),
    paddingVertical: spacing('xs'),
  },
  monthYearText: {
    fontSize: 18,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  monthYearArrow: {
    fontSize: 12,
    fontFamily: 'MPLUSRounded1c-Regular',
  },
  monthHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('xs'),
  },
  monthHeaderText: {
    fontSize: 18,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  monthHeaderArrow: {
    fontSize: 12,
    fontFamily: 'MPLUSRounded1c-Regular',
  },
  arrowContainer: {
    padding: spacing('xs'),
  },
  arrowText: {
    fontSize: 24,
    fontFamily: 'MPLUSRounded1c-Regular',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing('md'),
    paddingTop: spacing('lg'),
    alignItems: 'center',
    gap: spacing('md'),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  okButtonContainer: {
    flex: 1,
  },
  okButtonWrapper: {
    marginHorizontal: 0,
  },
  okButton: {
    height: vs(54),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  okButtonText: {
    textAlign: 'center',
  },
});

// Month/Year Picker Component
interface MonthYearPickerProps {
  visible: boolean;
  currentDate: Date;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  visible,
  currentDate,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  useEffect(() => {
    if (visible) {
      setSelectedYear(currentDate.getFullYear());
      setSelectedMonth(currentDate.getMonth());
    }
  }, [visible, currentDate]);

  const handleConfirm = () => {
    onSelect(selectedYear, selectedMonth);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[pickerStyles.container, { backgroundColor: theme.colors.background }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={pickerStyles.header}>
            <Text style={[pickerStyles.headerTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
              Select Month & Year
            </Text>
          </View>

          <View style={pickerStyles.content}>
            <View style={pickerStyles.pickerColumn}>
              <Text style={[pickerStyles.label, { color: theme.colors.textSecondary }]} allowFontScaling={false}>Month</Text>
              <ScrollView style={pickerStyles.scrollView} showsVerticalScrollIndicator={false}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      pickerStyles.item,
                      selectedMonth === index && { backgroundColor: theme.colors.orange500 },
                    ]}
                    onPress={() => setSelectedMonth(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[pickerStyles.itemText, { color: selectedMonth === index ? '#FFFFFF' : theme.colors.textPrimary }]} allowFontScaling={false}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={pickerStyles.pickerColumn}>
              <Text style={[pickerStyles.label, { color: theme.colors.textSecondary }]} allowFontScaling={false}>Year</Text>
              <ScrollView style={pickerStyles.scrollView} showsVerticalScrollIndicator={false}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      pickerStyles.item,
                      selectedYear === year && { backgroundColor: theme.colors.orange500 },
                    ]}
                    onPress={() => setSelectedYear(year)}
                    activeOpacity={0.7}
                  >
                    <Text style={[pickerStyles.itemText, { color: selectedYear === year ? '#FFFFFF' : theme.colors.textPrimary }]} allowFontScaling={false}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={pickerStyles.actions}>
            <TouchableOpacity style={pickerStyles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={[pickerStyles.cancelText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pickerStyles.confirmButton, { backgroundColor: theme.colors.orange500 }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={[pickerStyles.confirmText, { color: '#FFFFFF', fontFamily: theme.typography.fontFamily.extraBold }]} allowFontScaling={false}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: radius('lg'),
    padding: spacing('md'),
    maxHeight: '80%',
  },
  header: {
    marginBottom: spacing('md'),
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'MPLUSRounded1c-Bold',
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    gap: spacing('md'),
    marginBottom: spacing('md'),
  },
  pickerColumn: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Medium',
    marginBottom: spacing('sm'),
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: ms(200),
  },
  item: {
    paddingVertical: spacing('sm'),
    paddingHorizontal: spacing('md'),
    borderRadius: radius('sm'),
    marginBottom: spacing('xs'),
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing('md'),
    marginTop: spacing('md'),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing('md'),
    borderRadius: radius('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
  },
});
