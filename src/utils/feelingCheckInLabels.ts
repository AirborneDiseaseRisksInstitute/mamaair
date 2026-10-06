import type { TFunction } from 'i18next';
import type { FeelingCheckInItem } from '../types/recommendationExperience';

const FALLBACK_KEY_PREFIX = 'fallback:';

export const feelingCheckInItemLabel = (
  item: FeelingCheckInItem,
  t: TFunction,
): string => {
  if (
    item.source !== 'localFallback' ||
    !item.key.startsWith(FALLBACK_KEY_PREFIX)
  ) {
    return item.name;
  }

  const translationKey = item.key
    .slice(FALLBACK_KEY_PREFIX.length)
    .replace(/:/g, '.')
    .replace(/-/g, '_');

  return t(`feeling_options.${translationKey}`, {
    defaultValue: item.name,
  });
};
