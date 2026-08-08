import { INTRO_PLAN_LOADING_DURATION_MS } from '../src/config/introPlanLoading';

describe('intro plan loading duration', () => {
  it('keeps progress and completion aligned to thirteen seconds', () => {
    expect(INTRO_PLAN_LOADING_DURATION_MS).toBe(13_000);
  });
});
