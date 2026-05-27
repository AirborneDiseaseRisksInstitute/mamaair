/**
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme, Text, TextInput, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRoot } from './src/App/AppRoot';
import { installCrashReporter } from './src/services/logger/CrashReporter';

// Install crash reporter as early as possible — must be before any code that can
// throw at module-load time. Build id is hardcoded; bump alongside versionCode.
installCrashReporter(`android-30`);

interface ErrorBoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // The global ErrorUtils handler also fires; we additionally surface a
    // visible fallback so the customer doesn't see Android's "app crashed" dialog.
    console.error('[RootErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    const e = this.state.error;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ padding: 24, paddingTop: Platform.OS === 'android' ? 60 : 80 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }} allowFontScaling={false}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 14, color: '#555', marginBottom: 16 }} allowFontScaling={false}>
          The app caught an error before it could crash. Restart to continue. If this keeps happening, please send the details below to support.
        </Text>
        <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, color: '#B00020', marginBottom: 8 }} allowFontScaling={false} selectable>
          {e.message}
        </Text>
        <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 10, color: '#666', marginBottom: 24 }} allowFontScaling={false} selectable>
          {e.stack || '(no stack)'}
        </Text>
        <TouchableOpacity onPress={this.reset} style={{ backgroundColor: '#F9AA01', padding: 14, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold' }} allowFontScaling={false}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

// Disable system font scaling globally to prevent layout breakage
// Our responsive system handles font scaling independently
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.allowFontScaling = false;
// Prevent system font size from scaling our text (Android accessibility)
(Text as any).defaultProps.maxFontSizeMultiplier = 1;

if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1;

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppRoot />
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

export default App;
