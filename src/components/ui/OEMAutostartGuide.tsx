import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme, spacing } from '../../theme';
import { Button } from './Button';
import {
  detectOEM,
  getOEMInstructions,
  openAutostartSettings,
  markAutostartGuideShown,
  type OEMVendor,
} from '../../services/tracking/OEMAutostartHelper';

interface OEMAutostartGuideProps {
  visible: boolean;
  onClose: () => void;
}

export const OEMAutostartGuide: React.FC<OEMAutostartGuideProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const vendor: OEMVendor = useMemo(() => detectOEM(), []);
  const { title, steps } = useMemo(() => getOEMInstructions(vendor), [vendor]);

  const handleOpenSettings = async () => {
    await openAutostartSettings(vendor);
  };

  const handleDone = () => {
    markAutostartGuideShown();
    onClose();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          padding: spacing('md'),
        },
        card: {
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: spacing('lg'),
        },
        title: {
          fontSize: 20,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          marginBottom: spacing('sm'),
          textAlign: 'center',
        },
        subtitle: {
          fontSize: 14,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.neutral600,
          marginBottom: spacing('md'),
          textAlign: 'center',
        },
        oemTitle: {
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.orange500,
          marginBottom: spacing('sm'),
        },
        step: {
          fontSize: 14,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textPrimary,
          marginBottom: 6,
          lineHeight: 20,
        },
        buttonRow: {
          marginTop: spacing('lg'),
          gap: spacing('sm'),
        },
        skipText: {
          textAlign: 'center',
          marginTop: spacing('md'),
          color: theme.colors.neutral500,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 14,
        },
      }),
    [theme],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDone}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title} allowFontScaling={false}>
            Keep tracking working
          </Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            Your phone needs one extra permission to keep MamaAir's air-quality tracking running in the background.
          </Text>

          <Text style={styles.oemTitle} allowFontScaling={false}>{title}</Text>
          {steps.map((step, i) => (
            <Text key={i} style={styles.step} allowFontScaling={false}>
              {step}
            </Text>
          ))}

          <View style={styles.buttonRow}>
            <Button title="Open Settings" onPress={handleOpenSettings} />
          </View>

          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.skipText} allowFontScaling={false}>I've enabled it / Remind me later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
