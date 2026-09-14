import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTimes,
  faCheck,
  faDroplet,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';
import { Button } from './Button';
import {
  WellbeingService,
  type WellbeingCatalogItem,
} from '../../services/api/WellbeingService';
import { useTranslation } from 'react-i18next';

/*
 * Local fallback catalog items are disabled for this release. Backend
 * symptoms/feelings remain the source of truth, and mood selections are not
 * persisted to the backend.
 *
 * const FALLBACK_MOODS: WellbeingCatalogItem[] = [
 *   { id: 1, name: 'Feel sick', emoji: '🤢' },
 *   { id: 2, name: 'Distressed', emoji: '😖' },
 *   { id: 3, name: 'Nervous', emoji: '😰' },
 *   { id: 4, name: 'Nauseous', emoji: '🤮' },
 * ];
 *
 * const FALLBACK_FEELINGS: WellbeingCatalogItem[] = [
 *   { id: 1, name: 'Everything is fine', emoji: '💪🏾' },
 *   { id: 2, name: 'Poor Sleep', emoji: '🙍🏾' },
 *   { id: 3, name: 'Headache', emoji: '🙎🏾' },
 *   { id: 4, name: 'Back Pain', emoji: '😣' },
 *   { id: 5, name: 'Fatigue', emoji: '😴' },
 *   { id: 6, name: 'Nausea', emoji: '🤢' },
 * ];
 */

const WATER_QUICK_AMOUNTS = [100, 250, 500];

interface SymptomsProps {
  onClose: () => void;
  onApply?: (data: {
    mood_ids: number[];
    feeling_ids: number[];
    water_amount: number;
  }) => void;
  initialMoodIds?: number[];
  initialFeelingIds?: number[];
  waterDailyTotal?: number;
  waterTarget?: number;
}

const APPLY_BUTTON_AREA = 72;
const MAX_PANEL_HEIGHT = SCREEN_HEIGHT * 0.72;

export const Symptoms: React.FC<SymptomsProps> = ({
  onClose,
  onApply,
  initialMoodIds = [],
  initialFeelingIds = [],
  waterDailyTotal = 0,
  waterTarget = 2000,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [moods, setMoods] = useState<WellbeingCatalogItem[]>([]);
  const [feelings, setFeelings] = useState<WellbeingCatalogItem[]>([]);
  const [selectedMoodIds, setSelectedMoodIds] = useState<number[]>(initialMoodIds);
  const [selectedFeelingIds, setSelectedFeelingIds] = useState<number[]>(initialFeelingIds);
  const [waterIncrement, setWaterIncrement] = useState(0);

  useEffect(() => {
    WellbeingService.getCatalog()
      .then((catalog) => {
        if (catalog.moods?.length) setMoods(catalog.moods);
        if (catalog.feelings?.length) setFeelings(catalog.feelings);
      })
      .catch(() => {
        // Keep catalog empty; do not invent local catalog IDs.
      });
  }, []);

  // Sync pre-selected IDs when parent passes them after async load
  useEffect(() => {
    setSelectedMoodIds(initialMoodIds);
  }, [initialMoodIds]);

  useEffect(() => {
    setSelectedFeelingIds(initialFeelingIds);
  }, [initialFeelingIds]);

  const toggleMood = (id: number) => {
    setSelectedMoodIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleFeeling = (id: number) => {
    setSelectedFeelingIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const feelingIds = new Set(feelings.map(item => item.id));
    onApply?.({
      mood_ids: [],
      feeling_ids: selectedFeelingIds.filter(id => feelingIds.has(id)),
      water_amount: waterIncrement,
    });
    onClose();
  };

  const styles = useMemo(() => StyleSheet.create({
    wrapper: {
      maxHeight: MAX_PANEL_HEIGHT,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: spacing('md'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral200,
    },
    sheetHeaderLeft: {
      alignItems: 'center',
      marginLeft: 'auto',
    },
    sheetTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    sheetSubtitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral500,
      textAlign: 'center',
      marginTop: 4,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    sectionContainer: {
      backgroundColor: theme.colors.neutral100,
      borderRadius: 16,
      padding: spacing('md'),
      marginTop: spacing('md'),
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('sm'),
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('sm'),
    },
    optionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: '#FFF',
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
    },
    optionChipSelected: {
      borderColor: theme.colors.orange500,
    },
    optionEmoji: {
      fontSize: 18,
      marginRight: 6,
    },
    optionLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    checkBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.orange500,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkBadgeText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    feelingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral200,
    },
    feelingRowLast: {
      borderBottomWidth: 0,
    },
    feelingEmoji: {
      fontSize: 20,
      marginRight: spacing('sm'),
    },
    feelingLabel: {
      flex: 1,
      fontSize: 15,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.neutral300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircleSelected: {
      backgroundColor: theme.colors.orange500,
      borderColor: theme.colors.orange500,
    },
    applyButtonContainer: {
      paddingTop: spacing('md'),
      paddingBottom: spacing('md'),
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral200,
    },
    waterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('sm'),
      gap: spacing('xs'),
    },
    waterTotalText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral500,
      marginLeft: 'auto',
    },
    waterProgressBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.neutral200,
      marginBottom: spacing('sm'),
      overflow: 'hidden',
    },
    waterProgressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#4FC3F7',
    },
    waterQuickRow: {
      flexDirection: 'row',
      gap: spacing('sm'),
      marginBottom: spacing('xs'),
    },
    waterQuickBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: '#E3F6FF',
      alignItems: 'center',
    },
    waterQuickBtnText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
      color: '#0288D1',
    },
    waterIncrementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    waterIncrementText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    waterResetBtn: {
      paddingHorizontal: spacing('sm'),
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.colors.neutral100,
    },
    waterResetText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral500,
    },
  }), [theme]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: APPLY_BUTTON_AREA }}
      >
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={styles.sheetTitle} allowFontScaling={false}>{t('symptoms.today')}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesomeIcon icon={faTimes as any} size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Mood Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>{t('symptoms.mood')}</Text>
          <View style={styles.optionsRow}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.optionChip,
                  selectedMoodIds.includes(mood.id) && styles.optionChipSelected,
                ]}
                onPress={() => toggleMood(mood.id)}
                activeOpacity={0.7}
              >
                {!!mood.emoji && (
                  <Text style={styles.optionEmoji} allowFontScaling={false}>{mood.emoji}</Text>
                )}
                <Text style={styles.optionLabel} allowFontScaling={false}>{mood.name}</Text>
                {selectedMoodIds.includes(mood.id) && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText} allowFontScaling={false}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Water Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.waterHeader}>
            <FontAwesomeIcon icon={faDroplet as any} size={16} color="#0288D1" />
            <Text style={styles.sectionTitle} allowFontScaling={false}>{t('symptoms.water')}</Text>
            <Text style={styles.waterTotalText} allowFontScaling={false}>
              {waterDailyTotal + waterIncrement} / {waterTarget} ml
            </Text>
          </View>
          <View style={styles.waterProgressBar}>
            <View
              style={[
                styles.waterProgressFill,
                { width: `${Math.min(100, ((waterDailyTotal + waterIncrement) / waterTarget) * 100)}%` },
              ]}
            />
          </View>
          <View style={styles.waterQuickRow}>
            {WATER_QUICK_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.waterQuickBtn}
                onPress={() => setWaterIncrement(prev => prev + amount)}
                activeOpacity={0.7}
              >
                <Text style={styles.waterQuickBtnText} allowFontScaling={false}>+{amount} ml</Text>
              </TouchableOpacity>
            ))}
          </View>
          {waterIncrement > 0 && (
            <View style={styles.waterIncrementRow}>
              <Text style={styles.waterIncrementText} allowFontScaling={false}>
                {t('symptoms.adding', { amount: waterIncrement })}
              </Text>
              <TouchableOpacity
                style={styles.waterResetBtn}
                onPress={() => setWaterIncrement(0)}
                activeOpacity={0.7}
              >
                <Text style={styles.waterResetText} allowFontScaling={false}>{t('symptoms.reset')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Feelings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>{t('symptoms.confirm')}</Text>
          {feelings.map((feeling, index) => {
            const isSelected = selectedFeelingIds.includes(feeling.id);
            const isLast = index === feelings.length - 1;
            return (
              <TouchableOpacity
                key={feeling.id}
                style={[styles.feelingRow, isLast && styles.feelingRowLast]}
                onPress={() => toggleFeeling(feeling.id)}
                activeOpacity={0.7}
              >
                {!!feeling.emoji && (
                  <Text style={styles.feelingEmoji} allowFontScaling={false}>{feeling.emoji}</Text>
                )}
                <Text style={styles.feelingLabel} allowFontScaling={false}>{feeling.name}</Text>
                <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                  {isSelected && (
                    <FontAwesomeIcon icon={faCheck as any} size={12} color="#FFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Apply Button */}
      <View style={styles.applyButtonContainer}>
        <Button title={t('symptoms.apply')} onPress={handleApply} />
      </View>
    </View>
  );
};
