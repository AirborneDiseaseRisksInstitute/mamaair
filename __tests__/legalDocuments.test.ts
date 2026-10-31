import { legalDocuments } from '../src/content/legalDocuments';

const visibleTerminologyPattern = /\bsymptoms?\b/i;

const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(collectStrings);
};

describe('legal documents', () => {
  it('provides email spam-folder guidance in every supported language', () => {
    const localeCopy = [
      require('../src/i18n/locales/en.json'),
      require('../src/i18n/locales/fr.json'),
      require('../src/i18n/locales/sw.json'),
    ];

    for (const locale of localeCopy) {
      expect(locale.auth.email_spam_folder_hint).toEqual(expect.any(String));
      expect(locale.auth.email_spam_folder_hint.trim()).not.toBe('');
    }
  });

  it('provides both documents in exactly the supported app languages', () => {
    expect(Object.keys(legalDocuments).sort()).toEqual(['en', 'fr', 'sw']);
    for (const documents of Object.values(legalDocuments)) {
      expect(Object.keys(documents).sort()).toEqual(['privacy', 'terms']);
      expect(documents.privacy.sections).toHaveLength(12);
      expect(documents.terms.sections).toHaveLength(7);
      for (const document of Object.values(documents)) {
        expect(document.title).toBeTruthy();
        expect(document.introduction).toBeTruthy();
        expect(document.sections.every(section => section.title && section.body)).toBe(true);
      }
    }
  });

  it('does not expose symptom terminology in user-facing copy', () => {
    const localeCopy = [
      require('../src/i18n/locales/en.json'),
      require('../src/i18n/locales/fr.json'),
      require('../src/i18n/locales/sw.json'),
    ];
    const visibleCopy = [
      ...collectStrings(legalDocuments),
      ...localeCopy.flatMap(collectStrings),
    ];

    expect(
      visibleCopy.filter(text => visibleTerminologyPattern.test(text)),
    ).toEqual([]);
  });

  it('does not claim that names are sent to an avatar-generation service', () => {
    for (const documents of Object.values(legalDocuments)) {
      const providerSection = documents.privacy.sections.find(section =>
        /provider|prestataire|watoa huduma/i.test(section.title),
      );
      expect(providerSection?.body).not.toMatch(
        /avatar|génération d.avatar|picha ya wasifu/i,
      );
    }
  });

  it('includes the public policy, account-deletion and privacy-contact paths', () => {
    for (const documents of Object.values(legalDocuments)) {
      const privacyCopy = collectStrings(documents.privacy).join(' ');
      expect(privacyCopy).toContain('https://api.mamaair.work/privacy-policy');
      expect(privacyCopy).toContain('https://api.mamaair.work/delete-account');
      expect(privacyCopy).toContain('service@mamaair.work');
    }
  });

  it('discloses location providers, retention, deletion and the adult-only rule', () => {
    for (const documents of Object.values(legalDocuments)) {
      const privacyCopy = collectStrings(documents.privacy).join(' ');
      expect(privacyCopy).toContain('HERE');
      expect(privacyCopy).toContain('OpenWeather');
      expect(privacyCopy).toMatch(/30 (days|jours)|siku 30/i);
      expect(privacyCopy).toMatch(/18/);
    }
  });
});
