module.exports = (api) => {
  const isProduction = api.env('production');
  api.cache.using(() => isProduction);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      // Strip console.* in production builds (security: prevents PII/token leaks via logcat)
      // Keeps appLogger usage which has its own gating
      ...(isProduction
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
      'react-native-reanimated/plugin',
    ],
  };
};
