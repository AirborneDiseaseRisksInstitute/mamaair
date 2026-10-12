import { useRecommendationExperienceStore } from '../../src/store/useRecommendationExperienceStore';

describe('recommendation experience day rollover persistence', () => {
  const owner = { backendUserId: 'jest-day-rollover-owner' };
  const temporaryOwner = { backendUserId: 'jest-day-rollover-temporary' };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 27, 23, 59));
    const store = useRecommendationExperienceStore.getState();
    store.ensureOwner(owner);
    store.clearCurrentOwnerData();
  });

  afterEach(() => {
    let store = useRecommendationExperienceStore.getState();
    store.ensureOwner(owner);
    store.clearCurrentOwnerData();
    store.ensureOwner(temporaryOwner);
    store.clearCurrentOwnerData();
    jest.useRealTimers();
  });

  it('does not overwrite the previous day when a task is completed tomorrow', () => {
    let store = useRecommendationExperienceStore.getState();
    store.setActionState('2026-09-27', 'evening-walk', 'completed', {
      domain: 'activity',
      kind: 'primary',
    });

    jest.setSystemTime(new Date(2026, 8, 28, 0, 1));
    expect(store.getActionCompletion('2026-09-28', 'evening-walk')).toBeNull();
    store.setActionState('2026-09-28', 'breakfast', 'completed', {
      domain: 'diet',
      kind: 'primary',
    });

    // Switch owners and back to force a fresh read from MMKV, like reopening
    // the app and restoring the signed-in user's recommendation state.
    store.ensureOwner(temporaryOwner);
    useRecommendationExperienceStore.getState().clearCurrentOwnerData();
    useRecommendationExperienceStore.getState().ensureOwner(owner);
    store = useRecommendationExperienceStore.getState();

    expect(store.getActionCompletion('2026-09-27', 'evening-walk')).toMatchObject({
      completed: true,
      domain: 'activity',
    });
    expect(store.getActionCompletion('2026-09-28', 'breakfast')).toMatchObject({
      completed: true,
      domain: 'diet',
    });
    expect(Object.keys(store.actionCompletions)).toEqual([
      '2026-09-27',
      '2026-09-28',
    ]);
  });
});
