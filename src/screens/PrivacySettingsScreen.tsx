import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { useTheme, spacing } from '../theme';
import { BackButton, AccessLocationBottomSheet } from '../components/ui';
import { responsiveUtils } from '../utils/responsiveUtils';

interface PrivacySettingsScreenProps {
  onBack?: () => void;
}

interface PrivacySetting {
  id: string;
  label: string;
  defaultValue: boolean;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ onBack }) => {
  const theme = useTheme();

  const privacySettings: PrivacySetting[] = [
    { id: 'sensitiveNotification', label: 'Sensitive notification', defaultValue: true },
    { id: 'personalData', label: 'Personal data', defaultValue: false },
    { id: 'preciseLocation', label: 'Precise location', defaultValue: true },
    { id: 'tracking', label: 'Tracking', defaultValue: false },
  ];

  const [settings, setSettings] = useState<Record<string, boolean>>(
    privacySettings.reduce((acc, setting) => {
      acc[setting.id] = setting.defaultValue;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [showLocationSheet, setShowLocationSheet] = useState(false);

  const handleToggle = (id: string) => {
    if (id === 'tracking') {
      const current = settings[id];
      if (!current) {
        setShowLocationSheet(true);
        return;
      }
    }
    setSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLocationAllow = () => {
    setSettings((prev) => ({ ...prev, tracking: true }));
    setShowLocationSheet(false);
  };

  const handleLocationClose = () => {
    setShowLocationSheet(false);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('md'),
      paddingTop: 50,
      paddingBottom: spacing('md'),
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 3,
    },
    headerTitle: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
      paddingTop: spacing('lg'),
    },
    illustrationContainer: {
      alignItems: 'center',
      marginTop: spacing('xl'),
      marginBottom: spacing('xl'),
    },
    illustrationImage: {
      width: 150,
      height: 150,
      resizeMode: 'contain',
    },
    headingText: {
      fontSize: responsiveUtils.getFixedFontSize(24),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginTop: spacing('xl'),
    },
    settingsCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      marginTop: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      overflow: 'hidden',
      marginBottom: 100,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing('md'),
      paddingHorizontal: spacing('md'),
    },
    settingText: {
      flex: 1,
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    settingDivider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginLeft: spacing('md'),
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>Privacy Setting</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../assets/images/Privacysetting.png')}
            style={styles.illustrationImage}
          />
          <Text style={styles.headingText} allowFontScaling={false}>Check your privacy</Text>
        </View>

        <View style={styles.settingsCard}>
          {privacySettings.map((setting, index) => (
            <React.Fragment key={setting.id}>
              <View style={styles.settingItem}>
                <Text style={styles.settingText} allowFontScaling={false}>{setting.label}</Text>
                <Switch
                  value={settings[setting.id]}
                  onValueChange={() => handleToggle(setting.id)}
                  trackColor={{
                    false: theme.colors.neutral300,
                    true: theme.colors.orange500,
                  }}
                  thumbColor="#fff"
                  ios_backgroundColor={theme.colors.neutral300}
                />
              </View>
              {index < privacySettings.length - 1 && <View style={styles.settingDivider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <AccessLocationBottomSheet
        visible={showLocationSheet}
        onClose={handleLocationClose}
        onAllow={handleLocationAllow}
        onNotNow={handleLocationClose}
      />
    </SafeAreaView>
  );
};

