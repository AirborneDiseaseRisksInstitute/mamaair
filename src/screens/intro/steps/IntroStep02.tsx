import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import {
  Button,
  Input,
  OrangeHalo,
  BackButton,
  type InputRef,
} from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';

interface IntroStep02Props {
  onNext?: () => void;
  onBack?: () => void;
}

export const IntroStep02: React.FC<IntroStep02Props> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { setName, setEmail, profile } = useUserStore();
  const [name, setNameLocal] = useState(profile.name || '');
  const [email, setEmailLocal] = useState(profile.email || '');

  // Sync with store if profile updates (e.g. from background fetch)
  React.useEffect(() => {
    if (profile.name) {
      const newName = profile.name;
      setNameLocal(prev => prev || newName);
    }
    if (profile.email) {
      const newEmail = profile.email;
      setEmailLocal(prev => prev || newEmail);
    }
  }, [profile.name, profile.email]);

  const nameInputRef = useRef<InputRef>(null);
  const emailInputRef = useRef<InputRef>(null);

  const isFormValid = name.trim().length > 0 && email.trim().length > 0;

  const handleNext = () => {
    setName(name);
    setEmail(email);
    if (onNext) onNext();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#fff',
        },
        contentWrapper: {
          flex: 1,
        },
        contentContainer: {
          flexGrow: 1,
          justifyContent: 'flex-start',
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('xl') + 40, // Reduced to keep inputs higher on small screens
        },
        instructionText: {
          fontSize: 18,
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing('xl'),
          lineHeight: 26,
          marginTop: spacing('xl'),
        },
        inputContainer: {
          width: '100%',
          marginBottom: spacing('lg'),
        },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background halo */}
      <OrangeHalo position="center" />

      {/* Back button */}
      <BackButton onPress={onBack} />

      {/* Content */}
      <ScrollView
        style={styles.contentWrapper}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.instructionText} allowFontScaling={false}>
          Enter your name and email for further services and supports.
        </Text>

        <View style={styles.inputContainer}>
          <Input
            ref={nameInputRef}
            title="Name"
            placeholder="Mary Anderson"
            type="text"
            value={name}
            onChangeText={setNameLocal}
            nextInputRef={emailInputRef}
          />
        </View>

        <View style={styles.inputContainer}>
          <Input
            ref={emailInputRef}
            title="Email"
            placeholder="mary.anderson@gmail.com"
            type="email"
            value={email}
            onChangeText={setEmailLocal}
            editable={true} // Email cannot be changed
          />
        </View>

        <Button title="CONTINUE" onPress={handleNext} disabled={!isFormValid} />
      </ScrollView>
    </SafeAreaView>
  );
};
