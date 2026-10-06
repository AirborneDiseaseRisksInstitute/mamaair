import type { TFunction } from 'i18next';
import { FEELING_CHECK_IN_SUPPLEMENT } from '../src/data/recommendations/feelingCheckInFallback';
import { feelingCheckInItemLabel } from '../src/utils/feelingCheckInLabels';

const locales = {
  en: require('../src/i18n/locales/en.json'),
  fr: require('../src/i18n/locales/fr.json'),
  sw: require('../src/i18n/locales/sw.json'),
};

const flatten = (
  value: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> =>
  Object.entries(value).reduce<Record<string, unknown>>(
    (result, [key, item]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.assign(
          result,
          flatten(item as Record<string, unknown>, path),
        );
      } else {
        result[path] = item;
      }
      return result;
    },
    {},
  );

describe('translation coverage', () => {
  it('keeps the same translation keys in every supported language', () => {
    const englishKeys = Object.keys(flatten(locales.en)).sort();

    expect(Object.keys(flatten(locales.fr)).sort()).toEqual(englishKeys);
    expect(Object.keys(flatten(locales.sw)).sort()).toEqual(englishKeys);
  });

  it('does not use symptom terminology in user-facing local copy', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      const forbiddenCopy = Object.entries(flatten(messages))
        .filter(
          ([, value]) =>
            typeof value === 'string' && /\bsymptoms?\b/i.test(value),
        )
        .map(([key, value]) => ({locale, key, value}));

      expect(forbiddenCopy).toEqual([]);
    }
  });

  it('translates every local feeling fallback without changing API labels', () => {
    const french = flatten(locales.fr);

    for (const item of FEELING_CHECK_IN_SUPPLEMENT) {
      const key = `feeling_options.${item.key
        .replace(/^fallback:/, '')
        .replace(/:/g, '.')
        .replace(/-/g, '_')}`;
      expect(french[key]).toEqual(expect.any(String));
      expect(String(french[key]).trim()).not.toBe('');
    }

    const translate = ((key: string) => french[key] ?? key) as TFunction;
    expect(
      feelingCheckInItemLabel(FEELING_CHECK_IN_SUPPLEMENT[0], translate),
    ).toBe('Anxieuse ou inquiète');
    expect(
      feelingCheckInItemLabel(
        {
          key: 'api:mood:1',
          kind: 'mood',
          group: 'wellbeing',
          name: 'Server-provided label',
          source: 'api',
        },
        translate,
      ),
    ).toBe('Server-provided label');
  });
});
