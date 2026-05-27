import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
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
import { WellbeingService, type WellbeingItem } from '../../services/api/WellbeingService';
import { useUserStore } from '../../store/useUserStore';
import { useToast } from './Toast';

// Local fallback used only if backend hasn't populated the emoji field yet.
const MOOD_EMOJI_FALLBACK: Record<string, string> = {
  feel_sick: '🤢',
  distressed: '😖',
  nervous: '😰',
  nauseous: '🤮',
};

const DEFAULT_WATER_GOAL = 72;

interface SymptomsProps {
  onClose: () => void;
  onApply?: (data: {
    moods: string[];
    symptoms: number[];
    waterAmount: number;
  }) => void;
}

export const Symptoms: React.FC<SymptomsProps> = ({ onClose, onApply }) => {
  const theme = useTheme();
  const { profile } = useUserStore();
  const { showToast } = useToast();
  const currentWeek = profile.pregnancyWeek || 1;
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<number[]>([]);
  const [waterAmount, setWaterAmount] = useState(0);
  const [waterGoal, setWaterGoal] = useState(DEFAULT_WATER_GOAL);
  const [waterUnit, setWaterUnit] = useState('fl.oz.');
  const [moodOptions, setMoodOptions] = useState<WellbeingItem[]>([]);
  const [feelingOptions, setFeelingOptions] = useState<WellbeingItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [saving, setSaving] = useState(false);

  // Water step: 8 fl.oz. (≈1 cup) or 250 ml (≈1 cup)
  const waterStep = useMemo(() => (waterUnit.toLowerCase().includes('ml') ? 250 : 8), [waterUnit]);

  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [catalog, todayLog] = await Promise.all([
          WellbeingService.getCatalog().catch(() => null),
          WellbeingService.getLog(todayDateStr).catch(() => null),
        ]);
        if (!mounted) return;

        if (catalog) {
          setMoodOptions(catalog.moods.filter(m => m.is_active));
          setFeelingOptions(catalog.feelings.filter(f => f.is_active));
          if (catalog.water_goal) {
            setWaterGoal(catalog.water_goal.value || DEFAULT_WATER_GOAL);
            setWaterUnit(catalog.water_goal.unit || 'fl.oz.');
          }
        }

        // Pre-populate from today's saved wellbeing log so user sees previous selections
        if (todayLog) {
          if (typeof todayLog.water_amount === 'number') setWaterAmount(todayLog.water_amount);
          if (todayLog.moods?.length) setSelectedMoods(todayLog.moods.map(m => m.id));
          if (todayLog.feelings?.length) setSelectedSymptoms(todayLog.feelings.map(f => f.id));
        }
      } catch (err) {
        console.warn('Failed to load wellbeing data:', err);
      } finally {
        if (mounted) setLoadingChecklist(false);
      }
    })();
    return () => { mounted = false; };
  }, [todayDateStr]);

  const toggleMood = (id: number) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleSymptom = (id: number) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const incrementWater = () => setWaterAmount(prev => Math.min(prev + waterStep, waterGoal));
  const decrementWater = () => setWaterAmount(prev => Math.max(prev - waterStep, 0));

  const handleApply = async () => {
    setSaving(true);
    try {
      await WellbeingService.logWellbeing({
        date: todayDateStr,
        water_amount: waterAmount,
        water_unit: waterUnit,
        mood_ids: selectedMoods,
        feeling_ids: selectedSymptoms,
      });

      // Success → notify parent and close
      if (onApply) {
        onApply({
          moods: selectedMoods.map(String),
          symptoms: selectedSymptoms,
          waterAmount,
        });
      }
      showToast({
        type: 'success',
        title: 'Saved',
        message: 'Your check-in has been recorded.',
      });
      onClose();
    } catch (err) {
      console.warn('Failed to save wellbeing data:', err);
      showToast({
        type: 'error',
        title: 'Save failed',
        message: 'Check your connection and tap Apply again.',
      });
      // Keep sheet open on failure so user can retry
    } finally {
      setSaving(false);
    }
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
      paddingTop: spacing('sm'),
      paddingBottom: spacing('sm'),
    },
  }), [theme]);

  return (
    <View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={styles.sheetTitle} allowFontScaling={false}>Today</Text>
            <Text style={styles.sheetSubtitle} allowFontScaling={false}>Week {currentWeek}</Text>
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
          {loadingChecklist ? (
            <ActivityIndicator size="small" color={theme.colors.orange500} />
          ) : moodOptions.length === 0 ? (
            <Text style={[styles.optionLabel, { color: theme.colors.neutral500 }]} allowFontScaling={false}>
              Check your connection — mood options didn't load.
            </Text>
          ) : (
            <View style={styles.optionsRow}>
              {moodOptions.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.optionChip,
                    selectedMoods.includes(mood.id) && styles.optionChipSelected,
                  ]}
                  onPress={() => toggleMood(mood.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji} allowFontScaling={false}>{mood.emoji || MOOD_EMOJI_FALLBACK[mood.code] || '😐'}</Text>
                  <Text style={styles.optionLabel} allowFontScaling={false}>{mood.title}</Text>
                  {selectedMoods.includes(mood.id) && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkBadgeText} allowFontScaling={false}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
            <Text style={styles.waterGoal} allowFontScaling={false}> / {waterGoal} {waterUnit}</Text>
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

        {/* Feelings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Feelings</Text>
          {loadingChecklist ? (
            <ActivityIndicator size="small" color={theme.colors.orange500} />
          ) : (
            <View style={styles.optionsRow}>
              {feelingOptions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionChip,
                    selectedSymptoms.includes(item.id) && styles.optionChipSelected,
                  ]}
                  onPress={() => toggleSymptom(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionLabel} allowFontScaling={false}>{item.title}</Text>
                  {selectedSymptoms.includes(item.id) && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkBadgeText} allowFontScaling={false}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Apply Button — fixed at bottom, always visible */}
      <View style={styles.applyButton}>
        <Button
          title={saving ? "Saving..." : "Apply"}
          onPress={handleApply}
          disabled={saving}
        />
      </View>
    </View>
  );
};

