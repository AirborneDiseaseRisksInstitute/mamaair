import {
  classifyEnvironmentalRiskLoadError,
  resolveEnvironmentalRiskCardState,
} from '../../src/services/recommendationExperience/EnvironmentalRiskCardPresenter';

describe('environmental risk card presentation', () => {
  it('shows a successful response without a reading as an empty state', () => {
    expect(
      resolveEnvironmentalRiskCardState({
        hasData: false,
        isLoading: false,
        loadError: null,
      }),
    ).toBe('empty');
  });

  it('keeps existing data visible while it refreshes', () => {
    expect(
      resolveEnvironmentalRiskCardState({
        hasData: true,
        isLoading: true,
        loadError: null,
      }),
    ).toBe('data');
  });

  it('preserves the concrete failure reason for the card', () => {
    expect(
      classifyEnvironmentalRiskLoadError({
        isAxiosError: true,
        code: 'ERR_NETWORK',
      }),
    ).toEqual({ kind: 'network' });
    expect(
      classifyEnvironmentalRiskLoadError({ response: { status: 503 } }),
    ).toEqual({ kind: 'server', status: 503 });
    expect(
      classifyEnvironmentalRiskLoadError({ response: { status: 400 } }),
    ).toEqual({ kind: 'validation', status: 400 });

    expect(
      resolveEnvironmentalRiskCardState({
        hasData: false,
        isLoading: false,
        loadError: { kind: 'network' },
      }),
    ).toBe('error');
    expect(
      resolveEnvironmentalRiskCardState({
        hasData: false,
        isLoading: false,
        loadError: { kind: 'validation', status: 400 },
      }),
    ).toBe('error');
  });
});
