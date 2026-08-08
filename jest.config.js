module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|@fortawesome|react-native-calendars|react-native-swipe-gestures|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-worklets)/)',
  ],
};
