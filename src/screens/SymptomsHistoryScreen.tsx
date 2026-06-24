import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../theme';
import { SymptomsService } from '../services/api/SymptomsService';
import { responsiveUtils } from '../utils/responsiveUtils';
import { useTranslation } from 'react-i18next';

interface SymptomItem {
  id: number;
  name: string;
}

interface SymptomsHistoryScreenProps {
  onBack?: () => void;
}

const getTodayDate = (): string => new Date().toLocaleDateString('en-CA');

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
};

const formatDateDisplay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const SymptomsHistoryScreen: React.FC<SymptomsHistoryScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const today = getTodayDate();

  const [date, setDate] = useState(today);
  const [mommyChecklist, setMommyChecklist] = useState<SymptomItem[]>([]);
  const [babyChecklist, setBabyChecklist] = useState<SymptomItem[]>([]);
  const [mommySelected, setMommySelected] = useState<number[]>([]);
  const [babySelected, setBabySelected] = useState<number[]>([]);
  const [checklistLoaded, setChecklistLoaded] = useState(false);
  const [loadingSelection, setLoadingSelection] = useState(false);

  useEffect(() => {
    Promise.all([
      SymptomsService.getMommyChecklist(),
      SymptomsService.getBabyChecklist(),
    ])
      .then(([mommy, baby]) => {
        setMommyChecklist(mommy?.symptoms || []);
        setBabyChecklist(baby?.symptoms || []);
        setChecklistLoaded(true);
      })
      .catch(() => setChecklistLoaded(true));
  }, []);

  const loadSelectionForDate = useCallback((d: string) => {
    setLoadingSelection(true);
    Promise.all([
      SymptomsService.getMommySelection(d).catch(() => null),
      SymptomsService.getBabySelection(d).catch(() => null),
    ])
      .then(([mommySel, babySel]) => {
        setMommySelected(mommySel?.symptom_ids || []);
        setBabySelected(babySel?.symptom_ids || []);
      })
      .finally(() => setLoadingSelection(false));
  }, []);

  useEffect(() => {
    if (checklistLoaded) {
      loadSelectionForDate(date);
    }
  }, [date, checklistLoaded, loadSelectionForDate]);

  const canGoForward = date < today;

  const goBack = () => setDate(prev => addDays(prev, -1));
  const goForward = () => { if (canGoForward) setDate(prev => addDays(prev, 1)); };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('md'),
      paddingTop: insets.top + spacing('md'),
      paddingBottom: spacing('md'),
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 3,
    },
    backButton: {
      padding: spacing('sm'),
      marginRight: spacing('sm'),
    },
    headerTitle: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    content: {
      flex: 1,
    },
    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('md'),
      paddingVertical: spacing('md'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral100,
    },
    dateNavBtn: {
      padding: spacing('sm'),
      borderRadius: 20,
      backgroundColor: theme.colors.neutral100,
    },
    dateNavBtnDisabled: {
      opacity: 0.35,
    },
    dateText: {
      fontSize: responsiveUtils.getFixedFontSize(15),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      flex: 1,
    },
    section: {
      marginHorizontal: spacing('md'),
      marginTop: spacing('lg'),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
      marginBottom: spacing('sm'),
      paddingBottom: spacing('sm'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral100,
    },
    sectionDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    sectionTitle: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    sectionCount: {
      fontSize: responsiveUtils.getFixedFontSize(13),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral500,
      marginLeft: 'auto',
    },
    symptomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: spacing('sm'),
    },
    symptomRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral100,
    },
    symptomName: {
      flex: 1,
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    symptomNameSelected: {
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.orange500,
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.neutral300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircleSelected: {
      backgroundColor: theme.colors.orange500,
      borderColor: theme.colors.orange500,
    },
    emptyText: {
      fontSize: responsiveUtils.getFixedFontSize(13),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral400,
      paddingVertical: spacing('md'),
      textAlign: 'center',
    },
    loadingContainer: {
      paddingVertical: spacing('xl'),
      alignItems: 'center',
    },
    bottomSpacer: {
      height: 40,
    },
  }), [theme, insets.top]);

  const renderSymptomList = (
    checklist: SymptomItem[],
    selected: number[],
    sectionColor: string,
  ) => {
    if (!checklistLoaded || loadingSelection) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.orange500} />
        </View>
      );
    }

    if (checklist.length === 0) {
      return <Text style={styles.emptyText} allowFontScaling={false}>{t('symptoms.no_symptoms')}</Text>;
    }

    const selectedCount = checklist.filter(s => selected.includes(s.id)).length;

    return checklist.map((symptom, index) => {
      const isSelected = selected.includes(symptom.id);
      const isLast = index === checklist.length - 1;
      return (
        <View
          key={symptom.id}
          style={[styles.symptomRow, !isLast && styles.symptomRowBorder]}
        >
          <Text
            style={[styles.symptomName, isSelected && styles.symptomNameSelected]}
            allowFontScaling={false}
          >
            {symptom.name}
          </Text>
          <View style={[styles.checkCircle, isSelected && { ...styles.checkCircleSelected, backgroundColor: sectionColor, borderColor: sectionColor }]}>
            {isSelected && <FontAwesomeIcon icon={faCheck as any} size={11} color="#FFF" />}
          </View>
        </View>
      );
    });
  };

  const mommySelectedCount = mommyChecklist.filter(s => mommySelected.includes(s.id)).length;
  const babySelectedCount = babyChecklist.filter(s => babySelected.includes(s.id)).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <FontAwesomeIcon icon={faArrowLeft as any} size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>{t('symptoms.history_title')}</Text>
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={goBack} activeOpacity={0.7}>
          <FontAwesomeIcon icon={faChevronLeft as any} size={14} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.dateText} allowFontScaling={false}>{formatDateDisplay(date)}</Text>
        <TouchableOpacity
          style={[styles.dateNavBtn, !canGoForward && styles.dateNavBtnDisabled]}
          onPress={goForward}
          activeOpacity={0.7}
          disabled={!canGoForward}
        >
          <FontAwesomeIcon icon={faChevronRight as any} size={14} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mother's Symptoms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#FF6900' }]} />
            <Text style={styles.sectionTitle} allowFontScaling={false}>{t('symptoms.mother_symptoms')}</Text>
            {!loadingSelection && mommySelectedCount > 0 && (
              <Text style={styles.sectionCount} allowFontScaling={false}>
                {mommySelectedCount} {t('symptoms.recorded')}
              </Text>
            )}
          </View>
          {renderSymptomList(mommyChecklist, mommySelected, '#FF6900')}
        </View>

        {/* Baby's Symptoms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#9C27B0' }]} />
            <Text style={styles.sectionTitle} allowFontScaling={false}>{t('symptoms.baby_symptoms')}</Text>
            {!loadingSelection && babySelectedCount > 0 && (
              <Text style={styles.sectionCount} allowFontScaling={false}>
                {babySelectedCount} {t('symptoms.recorded')}
              </Text>
            )}
          </View>
          {renderSymptomList(babyChecklist, babySelected, '#9C27B0')}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};
