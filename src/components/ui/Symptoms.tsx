import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTimes,
  faMinus,
  faPlus,
  faChevronRight,
  faGlassWater,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';
import { Button } from './Button';

// Mood options data
const MOOD_OPTIONS = [
  { id: 'feel_sick', emoji: '🤢', label: 'Feel sick' },
  { id: 'distressed', emoji: '😖', label: 'Distressed' },
  { id: 'nervous', emoji: '😰', label: 'Nervous' },
  { id: 'nauseous', emoji: '🤮', label: 'nauseous' },
];

// Symptoms options data
const SYMPTOMS_OPTIONS = [
  { id: 'everything_fine', emoji: '💪🏾', label: 'Everything is fine' },
  { id: 'poor_sleep', emoji: '🙍🏾', label: 'Poor Sleep' },
  { id: 'headache', emoji: '🙎🏾', label: 'Headache' },
];

const WATER_GOAL = 72;

interface SymptomsProps {
  onClose: () => void;
  onApply?: (data: {
    moods: string[];
    symptoms: string[];
    waterAmount: number;
  }) => void;
}

export const Symptoms: React.FC<SymptomsProps> = ({ onClose, onApply }) => {
  const theme = useTheme();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [waterAmount, setWaterAmount] = useState(0);

  const toggleMood = (id: string) => {
    setSelectedMoods(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const incrementWater = () => setWaterAmount(prev => Math.min(prev + 8, WATER_GOAL));
  const decrementWater = () => setWaterAmount(prev => Math.max(prev - 8, 0));

  const handleApply = () => {
    if (onApply) {
      onApply({
        moods: selectedMoods,
        symptoms: selectedSymptoms,
        waterAmount,
      });
    }
    onClose();
  };

  const styles = useMemo(() => StyleSheet.create({
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: spacing('md'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral200,
    },
    sheetHeaderLeft: {
      display:'flex',
      alignItems: 'center',
      marginLeft:'auto'
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
      marginLeft:'auto'
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
    waterContainer: {
      backgroundColor: theme.colors.neutral100,
      borderRadius: 16,
      padding: spacing('md'),
      marginTop: spacing('md'),
    },
    waterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    waterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    waterLabel: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    waterControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
    },
    waterButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.neutral300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    waterAmount: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginTop: spacing('sm'),
    },
    waterGoal: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral500,
    },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing('md'),
      marginTop: spacing('md'),
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral200,
    },
    reminderText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral500,
    },
    applyButton: {
      marginTop: spacing('lg'),
      marginBottom: spacing('lg'),
    },
  }), [theme]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={styles.sheetHeaderLeft}>
          <Text style={styles.sheetTitle} allowFontScaling={false}>Today</Text>
          <Text style={styles.sheetSubtitle} allowFontScaling={false}>Day 4/ 19th Week</Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <FontAwesomeIcon 
            icon={faTimes as any} 
            size={20} 
            color={theme.colors.textPrimary} 
          />
        </TouchableOpacity>
      </View>

      {/* Mood Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle} allowFontScaling={false}>Mood</Text>
        <View style={styles.optionsRow}>
          {MOOD_OPTIONS.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.optionChip,
                selectedMoods.includes(mood.id) && styles.optionChipSelected,
              ]}
              onPress={() => toggleMood(mood.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji} allowFontScaling={false}>{mood.emoji}</Text>
              <Text style={styles.optionLabel} allowFontScaling={false}>{mood.label}</Text>
              {selectedMoods.includes(mood.id) && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText} allowFontScaling={false}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Water Section */}
      <View style={styles.waterContainer}>
        <View style={styles.waterHeader}>
          <View style={styles.waterLeft}>
            <FontAwesomeIcon 
              icon={faGlassWater as any} 
              size={20} 
              color="#2196F3"
              style={{ marginRight: spacing('sm') }}
            />
            <Text style={styles.waterLabel} allowFontScaling={false}>Water</Text>
          </View>
          <View style={styles.waterControls}>
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={decrementWater}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon 
                icon={faMinus as any} 
                size={14} 
                color={theme.colors.neutral600} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={incrementWater}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon 
                icon={faPlus as any} 
                size={14} 
                color={theme.colors.neutral600} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.waterAmount} allowFontScaling={false}>
          {waterAmount}
          <Text style={styles.waterGoal} allowFontScaling={false}> / {WATER_GOAL} fl. oz.</Text>
        </Text>
        <TouchableOpacity style={styles.reminderRow} activeOpacity={0.7}>
          <Text style={styles.reminderText} allowFontScaling={false}>Reminders and settings</Text>
          <FontAwesomeIcon 
            icon={faChevronRight as any} 
            size={14} 
            color={theme.colors.neutral400} 
          />
        </TouchableOpacity>
      </View>

      {/* Symptoms Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle} allowFontScaling={false}>Symptoms</Text>
        <View style={styles.optionsRow}>
          {SYMPTOMS_OPTIONS.map((symptom) => (
            <TouchableOpacity
              key={symptom.id}
              style={[
                styles.optionChip,
                selectedSymptoms.includes(symptom.id) && styles.optionChipSelected,
              ]}
              onPress={() => toggleSymptom(symptom.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji} allowFontScaling={false}>{symptom.emoji}</Text>
              <Text style={styles.optionLabel} allowFontScaling={false}>{symptom.label}</Text>
              {selectedSymptoms.includes(symptom.id) && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText} allowFontScaling={false}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Apply Button */}
      <View style={styles.applyButton}>
        <Button
          title="Apply"
          onPress={handleApply}
        />
      </View>
    </ScrollView>
  );
};

