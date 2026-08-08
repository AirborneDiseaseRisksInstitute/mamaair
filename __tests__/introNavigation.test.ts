import { resolveIntroCompletionRoute } from '../src/utils/introNavigation';

describe('intro completion navigation', () => {
  it.each(['completed', 'skipped'] as const)(
    'shows plan loading before Start for a %s intro',
    reason => {
      expect(resolveIntroCompletionRoute(reason)).toBe(
        'IntroLoading',
      );
    },
  );
});
