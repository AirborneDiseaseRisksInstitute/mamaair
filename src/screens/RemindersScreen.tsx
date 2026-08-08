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
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../theme';
import { BackButton, ReminderTimePicker, useToast } from '../components/ui';
import { BEHAVIOUR_SVG, RUNNING_SVG, DIET_SVG } from '../utils/svgIcons';
import { SvgXml } from 'react-native-svg';
import { responsiveUtils } from '../utils/responsiveUtils';
import { AdviceService } from '../services/api/AdviceService';
import { useTranslation } from 'react-i18next';

interface RemindersScreenProps {
  onBack?: () => void;
}

const REMINDER_CARDS = [
  {
    id: 'behavior',
    backgroundColor: '#FBEBEB',
    iconBgColor: '#FFDEE5',
    editCircleBg: '#F5D5D5',
    svg: BEHAVIOUR_SVG,
  },
  {
    id: 'activity',
    backgroundColor: '#FDFCE8',
    iconBgColor: '#FFEABD',
    editCircleBg: '#F5F0C4',
    svg: RUNNING_SVG,
  },
  {
    id: 'diet',
    backgroundColor: '#E8FCF0',
    iconBgColor: '#B9FAD7',
    editCircleBg: '#C8F0DC',
    svg: DIET_SVG,
  },
];

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [reminderTaskTitle, setReminderTaskTitle] = useState<string | null>(null);
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

  const openReminderPicker = (taskTitle: string) => {
    setReminderTaskTitle(taskTitle);
    setReminderPickerVisible(true);
  };

  const handleReminderConfirm = (hour: number, minute: number) => {
    const titleForToast = reminderTaskTitle ?? t('reminders.title');
    setReminderPickerVisible(false);
    setReminderTaskTitle(null);
    showToast({
      type: 'success',
      title: titleForToast,
      message: t('today.reminder_set', {
        time: `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`,
      }),
    });
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
        style={{ flex: 1 }}
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

        {REMINDER_CARDS.map((card) => (
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
                  <SvgXml xml={card.svg} width={20} height={20} />
                </View>
                <Text style={styles.cardTitle} allowFontScaling={false}>
                  {card.id === 'behavior' ? t('today.behaviour') : card.id === 'activity' ? t('today.activity') : t('today.diet')}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.editButton,
                  { backgroundColor: card.editCircleBg },
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  openReminderPicker(
                    card.id === 'behavior'
                      ? t('today.behaviour')
                      : card.id === 'activity'
                        ? t('today.activity')
                        : t('today.diet'),
                  )
                }
              >
                <FontAwesomeIcon
                  icon={faPenToSquare as any}
                  size={12}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardDescription} allowFontScaling={false}>
              {adviceByCategory[card.id] ??
                adviceByCategory.general ??
                t(`reminders.${card.id}_description`)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <ReminderTimePicker
        visible={reminderPickerVisible}
        onClose={() => {
          setReminderPickerVisible(false);
          setReminderTaskTitle(null);
        }}
        onConfirm={handleReminderConfirm}
        taskTitle={reminderTaskTitle ?? undefined}
      />
    </SafeAreaView>
  );
};
