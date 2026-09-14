import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBrain, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../theme';
import { BackButton, ReminderTimePicker, useToast } from '../components/ui';
import { BEHAVIOUR_SVG, RUNNING_SVG, DIET_SVG } from '../utils/svgIcons';
import { SvgXml } from 'react-native-svg';
import { responsiveUtils } from '../utils/responsiveUtils';
import { AdviceService } from '../services/api/AdviceService';
import { useTranslation } from 'react-i18next';
import {
  cancelCategoryReminder,
  getCategoryReminderSettings,
  scheduleCategoryReminder,
  type ReminderCategory,
} from '../services/NotificationService';
import { useUserStore } from '../store/useUserStore';

interface RemindersScreenProps {
  onBack?: () => void;
}

const REMINDER_CARDS: Array<{
  id: ReminderCategory;
  backgroundColor: string;
  iconBgColor: string;
  editCircleBg: string;
  svg?: string;
  icon?: typeof faBrain;
  iconColor?: string;
  titleKey: string;
}> = [
  {
    id: 'behavior',
    backgroundColor: '#FBEBEB',
    iconBgColor: '#FFDEE5',
    editCircleBg: '#F5D5D5',
    svg: BEHAVIOUR_SVG,
    titleKey: 'today.behaviour',
  },
  {
    id: 'activity',
    backgroundColor: '#FDFCE8',
    iconBgColor: '#FFEABD',
    editCircleBg: '#F5F0C4',
    svg: RUNNING_SVG,
    titleKey: 'today.activity',
  },
  {
    id: 'diet',
    backgroundColor: '#E8FCF0',
    iconBgColor: '#B9FAD7',
    editCircleBg: '#C8F0DC',
    svg: DIET_SVG,
    titleKey: 'today.diet',
  },
  {
    id: 'wellbeing',
    backgroundColor: '#F6F0FA',
    iconBgColor: '#E7D9F0',
    editCircleBg: '#DED0E8',
    icon: faBrain,
    iconColor: '#70428F',
    titleKey: 'today.domain_wellbeing',
  },
];

// Category reminders are scheduled and stored entirely on the device.
const CARD_REMINDER_SCHEDULING_ENABLED = true;

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const notificationDays = useUserStore(
    state => state.profile.notifDays ?? '1111111',
  );
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [reminderTaskTitle, setReminderTaskTitle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ReminderCategory | null>(null);
  const [categoryReminders, setCategoryReminders] = useState(
    getCategoryReminderSettings,
  );
  const [adviceByCategory, setAdviceByCategory] = useState<Record<string, string>>({});

  useEffect(() => {
    AdviceService.getAdvice()
      .then((data: any) => {
        const recs: any[] = data?.recommendations ?? [];
        const map: Record<string, string> = {};
        for (const rec of recs) {
          if (rec.category && rec.message) {
            map[rec.category] = rec.message;
          }
        }
        setAdviceByCategory(map);
      })
      .catch(() => {});
  }, []);

  const openReminderPicker = (
    category: ReminderCategory,
    taskTitle: string,
  ) => {
    setSelectedCategory(category);
    setReminderTaskTitle(taskTitle);
    setReminderPickerVisible(true);
  };

  const closeReminderPicker = () => {
    setReminderPickerVisible(false);
    setReminderTaskTitle(null);
    setSelectedCategory(null);
  };

  const handleReminderConfirm = async (hour: number, minute: number) => {
    const category = selectedCategory;
    if (!category) return;
    const titleForToast = reminderTaskTitle ?? t('reminders.title');
    const time = `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
    closeReminderPicker();
    const status = await scheduleCategoryReminder({
      category,
      hour,
      minute,
      body: t(`reminders.${category}_notification`),
      days: notificationDays,
    });
    setCategoryReminders(getCategoryReminderSettings());

    if (status === 'failed') {
      showToast({
        type: 'error',
        title: t('reminders.not_set'),
        message: t('today.reminder_try_again'),
      });
      return;
    }
    if (status === 'noDaysSelected') {
      showToast({
        type: 'info',
        title: titleForToast,
        message: t('reminders.select_days'),
      });
      return;
    }
    if (status === 'permissionDenied') {
      showToast({
        type: 'info',
        title: titleForToast,
        message: t('reminders.permission_needed'),
      });
      return;
    }
    showToast({
      type: 'success',
      title: titleForToast,
      message: t('today.reminder_set', {
        time,
      }),
    });
  };

  const handleReminderRemove = async () => {
    const category = selectedCategory;
    if (!category) return;
    closeReminderPicker();
    await cancelCategoryReminder(category);
    setCategoryReminders(getCategoryReminderSettings());
    showToast({
      type: 'success',
      title: t('today.reminder_removed'),
      message: t('today.reminder_removed_body'),
    });
  };

  const formatReminderTime = (hour: number, minute: number): string =>
    `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;

  const reminderStatusText = (
    reminder: ReturnType<typeof getCategoryReminderSettings>[ReminderCategory],
  ): string => {
    if (!reminder) return t('reminders.not_set');
    const time = formatReminderTime(reminder.hour, reminder.minute);
    if (reminder.status === 'needsPermission') {
      return t('reminders.saved_notifications_off', { time });
    }
    if (reminder.status === 'needsDays') {
      return t('reminders.saved_no_days', { time });
    }
    if (reminder.status === 'failed') {
      return t('reminders.saved_retry_needed', { time });
    }
    return t('reminders.scheduled_time', { time });
  };

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
          color: theme.colors.orange500,
        },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('lg'),
          paddingBottom: 120,
        },
        scroll: {
          flex: 1,
        },
        imageContainer: {
          alignItems: 'center',
          marginBottom: spacing('xl'),
        },
        reminderImage: {
          width: 150,
          height: 150,
          resizeMode: 'contain',
        },
        card: {
          borderRadius: 16,
          padding: spacing('md'),
          marginBottom: spacing('md'),
          position: 'relative',
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: spacing('sm'),
        },
        cardTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing('md'),
        },
        cardTitle: {
          fontSize: responsiveUtils.getFixedFontSize(16),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          flex: 1,
        },
        cardTitleCopy: {
          flex: 1,
        },
        reminderStatus: {
          marginTop: 2,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: responsiveUtils.getFixedFontSize(11),
        },
        editButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        },
        cardDescription: {
          fontSize: responsiveUtils.getFixedFontSize(13),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textPrimary,
          lineHeight: responsiveUtils.getFixedLineHeight(13, 20),
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          {t('reminders.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/reminder.png')}
            style={styles.reminderImage}
            resizeMode="contain"
          />
        </View>

        {REMINDER_CARDS.map(card => {
          const reminder = categoryReminders[card.id];
          const cardTitle = t(card.titleKey);
          return (
            <View
              key={card.id}
              style={[styles.card, { backgroundColor: card.backgroundColor }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: card.iconBgColor },
                    ]}
                  >
                    {card.svg ? (
                      <SvgXml xml={card.svg} width={20} height={20} />
                    ) : card.icon ? (
                      <FontAwesomeIcon
                        icon={card.icon}
                        size={20}
                        color={card.iconColor}
                      />
                    ) : null}
                  </View>
                  <View style={styles.cardTitleCopy}>
                    <Text style={styles.cardTitle} allowFontScaling={false}>
                      {cardTitle}
                    </Text>
                    <Text
                      style={styles.reminderStatus}
                      allowFontScaling={false}
                    >
                      {reminderStatusText(reminder)}
                    </Text>
                  </View>
                </View>
                {CARD_REMINDER_SCHEDULING_ENABLED ? (
                  <TouchableOpacity
                    style={[
                      styles.editButton,
                      { backgroundColor: card.editCircleBg },
                    ]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('reminders.edit_category', {
                      category: cardTitle,
                    })}
                    onPress={() => openReminderPicker(card.id, cardTitle)}
                  >
                    <FontAwesomeIcon
                      icon={faPenToSquare as any}
                      size={12}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.cardDescription} allowFontScaling={false}>
                {adviceByCategory[card.id] ??
                  adviceByCategory.general ??
                  t(`reminders.${card.id}_description`)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {CARD_REMINDER_SCHEDULING_ENABLED ? (
        <ReminderTimePicker
          visible={reminderPickerVisible}
          onClose={closeReminderPicker}
          onConfirm={handleReminderConfirm}
          initialHour={
            selectedCategory
              ? categoryReminders[selectedCategory]?.hour
              : undefined
          }
          initialMinute={
            selectedCategory
              ? categoryReminders[selectedCategory]?.minute
              : undefined
          }
          taskTitle={reminderTaskTitle ?? undefined}
          onRemove={
            selectedCategory && categoryReminders[selectedCategory]
              ? handleReminderRemove
              : undefined
          }
        />
      ) : null}
    </SafeAreaView>
  );
};
