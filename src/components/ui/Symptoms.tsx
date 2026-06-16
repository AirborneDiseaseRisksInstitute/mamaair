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
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';
import { Button } from './Button';
import { WellbeingService, type WellbeingCatalogItem } from '../../services/api/WellbeingService';

// Fallback options used when API catalog is unavailable
const FALLBACK_MOODS: WellbeingCatalogItem[] = [
  { id: 1, name: 'Feel sick', emoji: '🤢' },
  { id: 2, name: 'Distressed', emoji: '😖' },
  { id: 3, name: 'Nervous', emoji: '😰' },
  { id: 4, name: 'Nauseous', emoji: '🤮' },
];

const FALLBACK_FEELINGS: WellbeingCatalogItem[] = [
  { id: 1, name: 'Everything is fine', emoji: '💪🏾' },
  { id: 2, name: 'Poor Sleep', emoji: '🙍🏾' },
  { id: 3, name: 'Headache', emoji: '🙎🏾' },
  { id: 4, name: 'Back Pain', emoji: '😣' },
  { id: 5, name: 'Fatigue', emoji: '😴' },
  { id: 6, name: 'Nausea', emoji: '🤢' },
];

interface SymptomsProps {
  onClose: () => void;
  onApply?: (data: {
    mood_ids: number[];
    feeling_ids: number[];
    water_amount: number;
  }) => void;
  initialMoodIds?: number[];
  initialFeelingIds?: number[];
}

const APPLY_BUTTON_AREA = 72;
const MAX_PANEL_HEIGHT = SCREEN_HEIGHT * 0.72;

export const Symptoms: React.FC<SymptomsProps> = ({
  onClose,
  onApply,
  initialMoodIds = [],
  initialFeelingIds = [],
}) => {
  const theme = useTheme();
  const [moods, setMoods] = useState<WellbeingCatalogItem[]>(FALLBACK_MOODS);
  const [feelings, setFeelings] = useState<WellbeingCatalogItem[]>(FALLBACK_FEELINGS);
  const [selectedMoodIds, setSelectedMoodIds] = useState<number[]>(initialMoodIds);
  const [selectedFeelingIds, setSelectedFeelingIds] = useState<number[]>(initialFeelingIds);

  useEffect(() => {
    WellbeingService.getCatalog()
      .then((catalog) => {
        if (catalog.moods?.length) setMoods(catalog.moods);
        if (catalog.feelings?.length) setFeelings(catalog.feelings);
      })
      .catch(() => {
        // keep fallback options
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
    onApply?.({
      mood_ids: selectedMoodIds,
      feeling_ids: selectedFeelingIds,
      water_amount: 0,
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
            <Text style={styles.sheetTitle} allowFontScaling={false}>Today</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesomeIcon icon={faTimes as any} size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Mood Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Mood</Text>
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

        {/* Feelings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Confirm your feelings:</Text>
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
        <Button title="Apply" onPress={handleApply} />
      </View>
    </View>
  );
};
