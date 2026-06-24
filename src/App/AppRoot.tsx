import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider } from '../theme';
import { Navigation } from './Navigation';
import { ToastProvider } from '../components/ui/Toast';
import { useLanguageSync } from '../hooks/useLanguageSync';

const AppInner: React.FC = () => {
  useLanguageSync();
  return <Navigation />;
};

export const AppRoot: React.FC = () => {
  return (
    <ThemeProvider>
      <View style={styles.container}>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});





