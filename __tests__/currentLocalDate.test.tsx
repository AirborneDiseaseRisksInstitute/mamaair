import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import { useCurrentLocalDate } from '../src/hooks/useCurrentLocalDate';

describe('useCurrentLocalDate', () => {
  let currentDate: string;
  let renderer: TestRenderer.ReactTestRenderer;
  let appStateListener: ((state: AppStateStatus) => void) | undefined;

  const Harness = () => {
    currentDate = useCurrentLocalDate();
    return null;
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 27, 23, 59, 30));
    appStateListener = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_type, listener) => {
        appStateListener = listener;
        return { remove: jest.fn() };
      },
    );
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer.unmount());
    }
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('rolls to the next local day while the app remains open', () => {
    act(() => {
      renderer = TestRenderer.create(<Harness />);
    });
    expect(currentDate).toBe('2026-09-27');

    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(currentDate).toBe('2026-09-28');
  });

  it('refreshes immediately when the app returns to the foreground', () => {
    act(() => {
      renderer = TestRenderer.create(<Harness />);
    });
    jest.setSystemTime(new Date(2026, 8, 28, 8, 0));

    act(() => appStateListener?.('active'));

    expect(currentDate).toBe('2026-09-28');
  });
});
