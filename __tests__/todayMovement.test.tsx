import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import { useTodayMovement } from '../src/hooks/useTodayMovement';
import { SummaryService } from '../src/services/api/SummaryService';
import { backgroundSync } from '../src/services/sync/BackgroundSync';
import {
  recordedDistanceMeters,
  formatMovementDistance,
} from '../src/utils/movementSummary';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => () => void) => {
    require('react').useEffect(callback, [callback]);
  },
}));
jest.mock('../src/config/dev', () => ({ DEV_LOCAL_SESSION: false }));
jest.mock('../src/services/api/SummaryService', () => ({
  SummaryService: { getSummary: jest.fn() },
}));
jest.mock('../src/services/sync/BackgroundSync', () => ({
  backgroundSync: { addUploadListener: jest.fn(() => jest.fn()) },
}));
jest.mock('../src/services/tracking/LocationAccessCoordinator', () => ({
  locationAccessCoordinator: {
    isTracking: jest.fn(() => true),
    addTrackingStateListener: jest.fn(() => jest.fn()),
  },
}));

describe('Today movement data', () => {
  it('keeps zero separate from missing or invalid readings and prefers metres', () => {
    expect(recordedDistanceMeters(null)).toBeNull();
    expect(recordedDistanceMeters({ today_journey: {} })).toBeNull();
    expect(
      recordedDistanceMeters({ today_journey: { distance_m: -1 } }),
    ).toBeNull();
    expect(
      recordedDistanceMeters({ today_journey: { distance_m: NaN } }),
    ).toBeNull();
    expect(
      recordedDistanceMeters({
        today_journey: { distance_m: 0, distance_km: 1 },
      }),
    ).toBe(0);
    expect(
      recordedDistanceMeters({ today_journey: { distance_km: 1.25 } }),
    ).toBe(1250);
    expect(formatMovementDistance(250, 'en')).toEqual({
      value: '250',
      unit: 'm',
    });
    expect(formatMovementDistance(1250, 'fr')).toEqual({
      value: '1,25',
      unit: 'km',
    });
  });

  let movement: ReturnType<typeof useTodayMovement>;
  let renderer: TestRenderer.ReactTestRenderer;
  const Harness = ({ date = '2026-09-29', owner = '7' }) => {
    movement = useTodayMovement(date, owner);
    return null;
  };
  beforeEach(() => {
    jest.clearAllMocks();
    AppState.currentState = 'active';
    act(() => {
      renderer = TestRenderer.create(<Harness />);
    });
  });
  afterEach(() => {
    act(() => renderer.unmount());
  });

  it('reuses Today’s summary and preserves the last reading on failure', async () => {
    expect(SummaryService.getSummary).not.toHaveBeenCalled();
    act(() => {
      movement.beginLoad()({ today_journey: { distance_m: 860 } }, null);
    });
    (SummaryService.getSummary as jest.Mock).mockRejectedValue({
      response: { status: 503 },
    });
    await act(async () => {
      await movement.refresh();
    });
    expect(movement.reading).toMatchObject({
      distanceMeters: 860,
      loading: false,
      failure: { kind: 'server', status: 503 },
    });
  });

  it('does not let an older request replace a newer reading', () => {
    let first: ReturnType<typeof movement.beginLoad>;
    let second: ReturnType<typeof movement.beginLoad>;
    act(() => {
      first = movement.beginLoad();
      second = movement.beginLoad();
    });
    act(() => second({ today_journey: { distance_m: 900 } }, null));
    act(() => first({ today_journey: { distance_m: 200 } }, null));
    expect(movement.reading.distanceMeters).toBe(900);
  });

  it('hides previous-day and previous-account readings and discards late results', () => {
    let complete: ReturnType<typeof movement.beginLoad>;
    act(() => {
      movement.beginLoad()({ today_journey: { distance_m: 860 } }, null);
      complete = movement.beginLoad();
    });
    act(() => renderer.update(<Harness date="2026-09-30" />));
    act(() => complete({ today_journey: { distance_m: 1000 } }, null));
    expect(movement.reading.distanceMeters).toBeNull();
    act(() =>
      movement.beginLoad()({ today_journey: { distance_m: 400 } }, null),
    );
    act(() => renderer.update(<Harness date="2026-09-30" owner="8" />));
    expect(movement.reading.distanceMeters).toBeNull();
  });

  it('refreshes only the summary after an upload and removes its subscription', async () => {
    (SummaryService.getSummary as jest.Mock).mockResolvedValue({
      today_journey: { distance_m: 1100 },
    });
    const subscribe = backgroundSync.addUploadListener as jest.Mock;
    await act(async () => {
      subscribe.mock.calls[0][0]();
    });
    expect(SummaryService.getSummary).toHaveBeenCalledTimes(1);
    expect(movement.reading.distanceMeters).toBe(1100);
    act(() => renderer.unmount());
    expect(subscribe.mock.results[0].value).toHaveBeenCalledTimes(1);
  });
});
