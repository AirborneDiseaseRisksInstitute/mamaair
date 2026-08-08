import {
  faBrain,
  faFaceGrimace,
  faStethoscope,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { resolveCheckInOptionIcon } from '../../src/components/recommendations/checkInOptionIcons';
import type { FeelingCheckInItem } from '../../src/types/recommendationExperience';

const makeItem = (
  overrides: Partial<FeelingCheckInItem>,
): FeelingCheckInItem => ({
  key: 'api:unknown',
  kind: 'mommySymptom',
  group: 'physical',
  name: 'Unknown symptom',
  source: 'api',
  ...overrides,
});

describe('check-in option icon resolver', () => {
  it('uses a semantic icon for a known physical symptom', () => {
    const presentation = resolveCheckInOptionIcon(
      makeItem({ name: 'Headache' }),
    );

    expect(presentation.icon).toBe(faFaceGrimace);
    expect(presentation.color).toBe('#C84B00');
  });

  it('uses the key when an API label is not descriptive', () => {
    const presentation = resolveCheckInOptionIcon(
      makeItem({
        key: 'api:mood:anxious',
        kind: 'mood',
        group: 'wellbeing',
        name: 'On edge',
      }),
    );

    expect(presentation.icon).toBe(faBrain);
    expect(presentation.color).toBe('#76508F');
  });

  it('keeps warning color semantics for unknown warning signs', () => {
    const presentation = resolveCheckInOptionIcon(
      makeItem({
        key: 'api:warning:other',
        group: 'warning',
        name: 'Other urgent change',
      }),
    );

    expect(presentation.icon).toBe(faTriangleExclamation);
    expect(presentation.color).toBe('#B93838');
  });

  it('falls back safely for future API physical symptoms', () => {
    const presentation = resolveCheckInOptionIcon(makeItem({}));

    expect(presentation.icon).toBe(faStethoscope);
  });
});
