import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/ui';
import { useTheme, spacing } from '../theme';
import {
  legalDocuments,
  type LegalDocumentKind,
  type LegalLanguage,
} from '../content/legalDocuments';

interface LegalDocumentsScreenProps {
  initialDocument: LegalDocumentKind;
  onBack: () => void;
}

export const LegalDocumentsScreen: React.FC<LegalDocumentsScreenProps> = ({
  initialDocument,
  onBack,
}) => {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const [documentKind, setDocumentKind] = useState(initialDocument);
  const language = i18n.language.split('-')[0] as LegalLanguage;
  const documents = legalDocuments[language] ?? legalDocuments.en;
  const document = documents[documentKind];

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.orange500 }]}>
          {t('legal.settings_section')}
        </Text>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['privacy', 'terms'] as const).map(kind => (
          <Pressable
            key={kind}
            accessibilityRole="tab"
            accessibilityState={{ selected: documentKind === kind }}
            onPress={() => setDocumentKind(kind)}
            style={[
              styles.tab,
              documentKind === kind && {
                borderBottomColor: theme.colors.orange500,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: documentKind === kind ? theme.colors.orange500 : theme.colors.textSecondary },
              ]}
            >
              {documents[kind].title}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        key={documentKind}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.introduction, { color: theme.colors.textPrimary }]}>
          {document.introduction}
        </Text>
        {document.sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionBody, { color: theme.colors.textSecondary }]}>
              {section.body}
            </Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL('https://mamaair.africa/')}
          style={styles.websiteLink}
        >
          <Text style={{ color: theme.colors.orange500 }}>mamaair.africa</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing('md'),
    paddingHorizontal: 56,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginHorizontal: spacing('md'),
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingHorizontal: spacing('xs'),
  },
  tabText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  content: { padding: spacing('md'), paddingBottom: spacing('xl') * 2 },
  introduction: { fontSize: 15, lineHeight: 23, marginBottom: spacing('lg') },
  section: { marginBottom: spacing('lg') },
  sectionTitle: { fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: spacing('xs') },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  websiteLink: { alignSelf: 'flex-start', paddingVertical: spacing('sm') },
});
