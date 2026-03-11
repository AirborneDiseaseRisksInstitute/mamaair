import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme, spacing } from '../theme';
import { Button, Input, DatePicker, HeightWeightPicker, WeekCycleView } from '../components/ui';

export const ComponentShowcaseScreen: React.FC = () => {
  const theme = useTheme();
  const [buttonPressCount, setButtonPressCount] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [heightWeightPickerVisible, setHeightWeightPickerVisible] = useState(false);
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [weekCycleReversed, setWeekCycleReversed] = useState(false);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            Component Showcase
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            List of built components
          </Text>
        </View>

        {/* Button Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            Button
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            Main application button
          </Text>

          <View style={styles.componentContainer}>
            <Button
              title="Normal Button"
              onPress={() => setButtonPressCount((prev) => prev + 1)}
            />

            <View style={styles.spacing} />

            <Button
              title="Disabled Button"
              onPress={() => {}}
              disabled={true}
            />

            {buttonPressCount > 0 && (
              <View style={styles.feedbackContainer}>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: theme.colors.orange500 },
                  ]}
                 allowFontScaling={false}>
                  Button pressed {buttonPressCount} time{buttonPressCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Input Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            Input
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            Text input field with label and shadow
          </Text>

          <View style={styles.componentContainer}>
            <Input
              title="Email"
              placeholder="yourmain@some.com"
              type="email"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              title="Password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChangeText={setPassword}
            />

            <Input
              title="Name"
              placeholder="Enter your name"
              type="text"
            />
          </View>
        </View>

        {/* DatePicker Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            DatePicker
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            Date picker with bottom sheet animation
          </Text>

          <View style={styles.componentContainer}>
            <Button
              title="Open Date Picker"
              onPress={() => setDatePickerVisible(true)}
            />

            {selectedDate && (
              <View style={styles.feedbackContainer}>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: theme.colors.orange500 },
                  ]}
                 allowFontScaling={false}>
                  Selected: {selectedDate.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* HeightWeightPicker Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            HeightWeightPicker
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            Height and weight picker with BMI calculation
          </Text>

          <View style={styles.componentContainer}>
            <Button
              title="Open Height & Weight Picker"
              onPress={() => setHeightWeightPickerVisible(true)}
            />

            {selectedHeight && selectedWeight && (
              <View style={styles.feedbackContainer}>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: theme.colors.orange500 },
                  ]}
                 allowFontScaling={false}>
                  Height: {selectedHeight}cm, Weight: {selectedWeight}kg
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* WeekCycleView Component Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            WeekCycleView
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
           allowFontScaling={false}>
            Weekly cycle view with circle and week days
          </Text>

          <View style={styles.componentContainer}>
            <View style={styles.weekCycleContainer}>
              <WeekCycleView
                reversed={weekCycleReversed}
                circleIcons={[
                  { index: 0, iconPath: 'heartSystem.svg', percentage: 25 },
                  { index: 3, iconPath: 'brainSystem.svg', percentage: 50 },
                  { index: 6, iconPath: 'boneSystem.svg', percentage: 75 },
                ]}
              />
            </View>

            <View style={styles.spacing} />

            <Button
              title={weekCycleReversed ? 'Normal Layout' : 'Reversed Layout'}
              onPress={() => setWeekCycleReversed(!weekCycleReversed)}
            />
          </View>
        </View>

        {/* Placeholder for future components */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
            Upcoming Components...
          </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.colors.textTertiary }]}
           allowFontScaling={false}>
            New components will be added here
          </Text>
        </View>
      </ScrollView>

      <DatePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(date) => {
          setSelectedDate(date);
          setDatePickerVisible(false);
        }}
        initialDate={selectedDate || undefined}
      />

      <HeightWeightPicker
        visible={heightWeightPickerVisible}
        onClose={() => setHeightWeightPickerVisible(false)}
        onConfirm={(height, weight) => {
          setSelectedHeight(height);
          setSelectedWeight(weight);
          setHeightWeightPickerVisible(false);
        }}
        initialHeight={selectedHeight || 170}
        initialWeight={selectedWeight || 60}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing('md'),
  },
  header: {
    marginBottom: spacing('xl'),
  },
  title: {
    fontSize: 28,
    fontFamily: 'MPLUSRounded1c-Bold',
    marginBottom: spacing('xs'),
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Regular',
  },
  section: {
    marginBottom: spacing('xl'),
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'MPLUSRounded1c-Bold',
    marginBottom: spacing('xs'),
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Regular',
    marginBottom: spacing('md'),
  },
  componentContainer: {
    marginTop: spacing('sm'),
    alignItems: 'center',
  },
  spacing: {
    height: spacing('md'),
  },
  feedbackContainer: {
    marginTop: spacing('md'),
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  weekCycleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing('lg'),
    borderRadius: spacing('md'),
  },
});

