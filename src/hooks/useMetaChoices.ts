import { useState, useEffect, useMemo } from 'react';
import { MetaService } from '../services/api/MetaService';
import { isSupportedLanguage } from '../i18n';
import { useTranslation } from 'react-i18next';

export interface MetaChoice {
  value: string;
  label: string;
  emoji?: string;
  label_with_emoji?: string;
}

export interface MetaChoices {
  languages: MetaChoice[];
  races: MetaChoice[];
  countries: MetaChoice[];
  work_types: MetaChoice[];
  diet_types: MetaChoice[];
  cooking_methods: MetaChoice[];
  exposure_levels: MetaChoice[];
}

const FALLBACK: MetaChoices = {
  languages: [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'sw', label: 'Swahili' },
  ],
  races: [
    { value: 'caucasian', label: 'Caucasian' },
    { value: 'african', label: 'African' },
    { value: 'asian', label: 'Asian' },
    { value: 'hispanic', label: 'Hispanic' },
    { value: 'mixed', label: 'Mixed' },
  ],
  countries: [
    { value: 'NG', label: 'Nigeria' },
    { value: 'GH', label: 'Ghana' },
    { value: 'KE', label: 'Kenya' },
    { value: 'other', label: 'Other' },
  ],
  work_types: [
    { value: 'Desk', label: 'Desk', emoji: '🪑' },
    { value: 'Standing', label: 'Standing', emoji: '🧍‍♀️' },
    { value: 'Physical', label: 'Physical', emoji: '💪' },
    { value: 'Care', label: 'Care', emoji: '🧑‍⚕️' },
    { value: 'Field', label: 'Field', emoji: '🌾' },
    { value: 'Domestic', label: 'Domestic', emoji: '👩‍👧‍👦' },
    { value: 'Night Shift', label: 'Night Shift', emoji: '🌙' },
  ],
  diet_types: [
    { value: 'carnivore', label: 'Carnivore', emoji: '🥩' },
    { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  ],
  cooking_methods: [
    { value: 'wood', label: 'Wood', emoji: '🪵' },
    { value: 'charcoal', label: 'Charcoal', emoji: '🪨' },
    { value: 'gas', label: 'Gas', emoji: '⛽' },
    { value: 'electric', label: 'Electric', emoji: '🔌' },
  ],
  exposure_levels: [
    { value: 'Clean', label: 'Clean' },
    { value: 'Very Good', label: 'Very Good' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Acceptable', label: 'Acceptable' },
    { value: 'Unhealthy', label: 'Unhealthy' },
    { value: 'High', label: 'High' },
    { value: 'Hazardous', label: 'Hazardous' },
    { value: 'Extreme', label: 'Extreme' },
  ],
};

// Module-level singleton — fetched once per app session, shared across all screens
let cache: MetaChoices | null = null;
let pending: Promise<MetaChoices> | null = null;

function loadChoices(): Promise<MetaChoices> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  pending = MetaService.getChoices()
    .then((data: any) => {
      const supportedLanguages = Array.isArray(data?.languages)
        ? data.languages.filter((language: MetaChoice) =>
            isSupportedLanguage(language.value),
          )
        : [];
      cache = {
        ...(data as MetaChoices),
        languages: supportedLanguages.length
          ? supportedLanguages
          : FALLBACK.languages,
      };
      return cache;
    })
    .catch(() => FALLBACK)
    .finally(() => { pending = null; });
  return pending;
}

export function useMetaChoices(): MetaChoices {
  const { t } = useTranslation();
  const [choices, setChoices] = useState<MetaChoices>(cache ?? FALLBACK);

  useEffect(() => {
    if (cache) return;
    loadChoices().then(c => setChoices(c));
  }, []);

  return useMemo(() => {
    const localized = (
      items: MetaChoice[],
      prefix: 'language' | 'country' | 'cooking' | 'work' | 'diet',
    ): MetaChoice[] =>
      items.map(item => {
        const normalizedValue = item.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_');
        return {
          ...item,
          label: t(`meta.${prefix}_${normalizedValue}`, {
            defaultValue: item.label,
          }),
        };
      });

    return {
      ...choices,
      languages: localized(choices.languages, 'language'),
      countries: localized(choices.countries, 'country'),
      cooking_methods: localized(choices.cooking_methods, 'cooking'),
      work_types: localized(choices.work_types, 'work'),
      diet_types: localized(choices.diet_types, 'diet'),
    };
  }, [choices, t]);
}
