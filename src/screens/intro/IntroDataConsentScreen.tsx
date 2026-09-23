import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { Button, FixedButtonContainer } from '../../components/ui';
import { useTheme, spacing } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import type { LegalDocumentKind } from '../../content/legalDocuments';
import { ProfileService } from '../../services/api/ProfileService';
import { DEV_LOCAL_SESSION } from '../../config/dev';

interface IntroDataConsentScreenProps {
  onContinue: () => void;
  onOpenLegal: (document: LegalDocumentKind) => void;
}

export const IntroDataConsentScreen: React.FC<IntroDataConsentScreenProps> = ({
  onContinue,
  onOpenLegal,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const setAgreementAccepted = useUserStore(state => state.setAgreementAccepted);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const continueToIntro = async () => {
    if (!accepted || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      if (!DEV_LOCAL_SESSION) {
        await ProfileService.patchProfile({ consent: true });
      }
      setAgreementAccepted(true);
      onContinue();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: theme.colors.orange500 }]}>Mama Air</Text>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {t('legal.health_title')}
        </Text>
        <Text style={[styles.body, { color: theme.colors.textPrimary }]}>
          {t('legal.health_intro')}
        </Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          {t('legal.health_details')}
        </Text>
        <View style={styles.links}>
          {(['privacy', 'terms'] as const).map(document => (
            <Pressable
              key={document}
              accessibilityRole="link"
              onPress={() => onOpenLegal(document)}
              style={styles.link}
            >
              <Text style={[styles.linkText, { color: theme.colors.orange500 }]}>
                {t(`legal.${document}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => setAccepted(value => !value)}
          style={styles.consentRow}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: theme.colors.orange500 },
              accepted && { backgroundColor: theme.colors.orange500 },
            ]}
          >
            {accepted ? <FontAwesomeIcon icon={faCheck} size={14} color="#fff" /> : null}
          </View>
          <Text style={[styles.consentText, { color: theme.colors.textPrimary }]}>
            {t('legal.health_accept')}
          </Text>
        </Pressable>
        {saveError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {t('legal.health_save_error')}
          </Text>
        ) : null}
      </ScrollView>
      <FixedButtonContainer backgroundColor="#fff">
        <Button
          title={t('legal.health_continue')}
          onPress={continueToIntro}
          disabled={!accepted || saving}
        />
      </FixedButtonContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, paddingHorizontal: spacing('lg'), paddingTop: spacing('xl') * 2, paddingBottom: 120 },
  brand: { fontSize: 16, fontWeight: '700', marginBottom: spacing('xl') },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '700', marginBottom: spacing('lg') },
  body: { fontSize: 15, lineHeight: 24, marginBottom: spacing('md') },
  links: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing('sm'), marginBottom: spacing('xl') },
  link: { paddingVertical: spacing('sm'), marginRight: spacing('lg') },
  linkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing('md') },
  checkbox: { width: 23, height: 23, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: spacing('md') },
  consentText: { flex: 1, fontSize: 15, lineHeight: 22 },
  error: { color: '#B93838', fontSize: 13, lineHeight: 20, marginTop: spacing('sm') },
});
