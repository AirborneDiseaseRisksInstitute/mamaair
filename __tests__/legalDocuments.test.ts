import { legalDocuments } from '../src/content/legalDocuments';

describe('legal documents', () => {
  it('provides both documents in exactly the supported app languages', () => {
    expect(Object.keys(legalDocuments).sort()).toEqual(['en', 'fr', 'sw']);
    for (const documents of Object.values(legalDocuments)) {
      expect(Object.keys(documents).sort()).toEqual(['privacy', 'terms']);
      expect(documents.privacy.sections).toHaveLength(8);
      expect(documents.terms.sections).toHaveLength(7);
      for (const document of Object.values(documents)) {
        expect(document.title).toBeTruthy();
        expect(document.introduction).toBeTruthy();
        expect(document.sections.every(section => section.title && section.body)).toBe(true);
      }
    }
  });
});
