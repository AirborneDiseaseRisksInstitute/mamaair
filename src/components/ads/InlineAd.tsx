import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { createMMKV } from 'react-native-mmkv';
import { useTranslation } from 'react-i18next';
import { getDailyPlanAdCreative, resolveAdImage } from '../../data/ads';
import type { RecommendationExperienceIdentity } from '../../types/recommendationExperience';
import { useTheme, spacing } from '../../theme';

const adStorage = createMMKV({ id: 'mamaair-ad-display' });

interface InlineAdProps {
  date: string;
  identity: RecommendationExperienceIdentity;
}

export const InlineAd: React.FC<InlineAdProps> = ({ date, identity }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const dismissalKey = `daily-plan:${identity.backendUserId ?? identity.email ?? 'local'}:${date}`;
  const [dismissed, setDismissed] = useState(() => adStorage.getBoolean(dismissalKey) ?? false);

  if (dismissed) return null;

  const imageWidth = Math.min(width - spacing('md') * 2, 270);
  const dismiss = () => {
    adStorage.set(dismissalKey, true);
    setDismissed(true);
  };

  return (
    <View style={[styles.container, { borderTopColor: theme.colors.neutral200 }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('ads.label')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('ads.dismiss')}
          onPress={dismiss}
          hitSlop={8}
          style={styles.dismissButton}
        >
          <FontAwesomeIcon icon={faXmark} size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
      <Image
        source={resolveAdImage(getDailyPlanAdCreative(date))}
        resizeMode="contain"
        accessibilityLabel={t('ads.label')}
        style={[styles.image, { width: imageWidth, height: imageWidth * 852 / 393 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing('lg'),
    paddingTop: spacing('sm'),
    paddingBottom: spacing('xl') + 72,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
  },
});
