import { createMMKV } from 'react-native-mmkv';
import { MovementHistoryRepository } from '../src/services/tracking/MovementHistoryRepository';
import { ENCRYPTED_MOVEMENT_HISTORY_STORAGE_ID } from '../src/services/storage/EncryptedStorage';

describe('local movement history', () => {
  let repository: MovementHistoryRepository;

  beforeEach(() => {
    repository = new MovementHistoryRepository();
    repository.clearAll();
  });

  it('stores a daily distance aggregate without persisting route coordinates', () => {
    const ownerKey = 'owner:v1:movement';
    const firstTime = new Date(2026, 9, 17, 9, 0).getTime();
    const secondTime = new Date(2026, 9, 17, 9, 5).getTime();

    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0,
      timestamp: firstTime,
    });
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0.001,
      timestamp: secondTime,
    });

    const date = '2026-10-17';
    const summary = repository.getWeeklySummary([ownerKey], [date]);
    expect(summary.recordedDays).toBe(1);
    expect(summary.days[0].sampleCount).toBe(2);
    expect(summary.days[0].distanceMeters).toBeCloseTo(111.2, 0);

    const raw = createMMKV({
      id: ENCRYPTED_MOVEMENT_HISTORY_STORAGE_ID,
    }).getString('daily-distance:v1');
    expect(raw).not.toContain('0.001');
    expect(raw).not.toContain('longitude');
    expect(raw).not.toContain('latitude');
  });

  it('does not connect movement across calendar days', () => {
    const ownerKey = 'owner:v1:movement';
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0,
      timestamp: new Date(2026, 9, 17, 23, 59).getTime(),
    });
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0.01,
      timestamp: new Date(2026, 9, 18, 0, 4).getTime(),
    });

    const summary = repository.getWeeklySummary(
      [ownerKey],
      ['2026-10-17', '2026-10-18'],
    );
    expect(summary.days.map(day => day.distanceMeters)).toEqual([0, 0]);
  });

  it('does not connect a new process session to the previous coordinate', () => {
    const ownerKey = 'owner:v1:movement';
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0,
      timestamp: new Date(2026, 9, 17, 9, 0).getTime(),
    });
    repository.resetTrackingSession();
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0.01,
      timestamp: new Date(2026, 9, 17, 9, 5).getTime(),
    });

    const day = repository.getWeeklySummary(
      [ownerKey],
      ['2026-10-17'],
    ).days[0];
    expect(day.distanceMeters).toBe(0);
    expect(day.sampleCount).toBe(2);
  });

  it('ignores stale samples and accepts the next chronological segment', () => {
    const ownerKey = 'owner:v1:movement';
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0,
      timestamp: new Date(2026, 9, 17, 9, 5).getTime(),
    });
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0.01,
      timestamp: new Date(2026, 9, 17, 9, 0).getTime(),
    });
    repository.recordLocation(ownerKey, {
      latitude: 0,
      longitude: 0.001,
      timestamp: new Date(2026, 9, 17, 9, 10).getTime(),
    });

    const day = repository.getWeeklySummary(
      [ownerKey],
      ['2026-10-17'],
    ).days[0];
    expect(day.distanceMeters).toBeCloseTo(111.2, 0);
    expect(day.sampleCount).toBe(2);
  });

  it('retains one year, prunes older days and keeps zero distinct from missing', () => {
    const ownerKey = 'owner:v1:movement';
    repository.mergeDailyDistance(ownerKey, '2025-10-31', 500);
    repository.mergeDailyDistance(
      ownerKey,
      '2026-11-01',
      0,
      new Date(2026, 10, 1, 12, 0).getTime(),
    );

    const summary = repository.getWeeklySummary(
      [ownerKey],
      ['2025-10-31', '2026-11-01', '2026-11-02'],
    );
    expect(summary.days.map(day => day.distanceMeters)).toEqual([null, 0, null]);
    expect(summary.recordedDays).toBe(1);
  });

  it('merges the current server total and keeps accounts scoped', () => {
    repository.mergeDailyDistance('owner:v1:first', '2026-10-17', 1200);
    repository.mergeDailyDistance('owner:v1:first', '2026-10-17', 900);
    repository.mergeDailyDistance('owner:v1:second', '2026-10-17', 300);

    expect(
      repository.getWeeklySummary(['owner:v1:first'], ['2026-10-17'])
        .totalDistanceMeters,
    ).toBe(1200);
    expect(
      repository.getWeeklySummary(
        ['owner:v1:first', 'owner:v1:second'],
        ['2026-10-17'],
      ).totalDistanceMeters,
    ).toBe(1200);

    repository.clearOwners(['owner:v1:first']);
    expect(
      repository.getWeeklySummary(['owner:v1:first'], ['2026-10-17'])
        .recordedDays,
    ).toBe(0);
  });
});
