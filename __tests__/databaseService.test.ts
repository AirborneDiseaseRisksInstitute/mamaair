jest.mock('react-native-nitro-sqlite', () => {
  const execute = jest.fn();
  return {
    open: jest.fn(() => ({ execute })),
    __execute: execute,
  };
});

import { databaseService } from '../src/services/database/DatabaseService';

const sqliteMock = jest.requireMock('react-native-nitro-sqlite') as {
  open: jest.Mock;
  __execute: jest.Mock;
};
const mockOpen = sqliteMock.open;
const mockExecute = sqliteMock.__execute;

describe('DatabaseService Nitro SQLite migration', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('keeps the existing database filename so queued locations survive upgrades', () => {
    expect(mockOpen).toHaveBeenCalledWith({ name: 'mamaair.sqlite' });
  });

  it('writes and reads location rows through Nitro SQLite', () => {
    const point = {
      latitude: -1.286389,
      longitude: 36.817223,
      accuracy: 12,
      speed: 1.2,
      timestamp: 1_700_000_000_000,
      isOutdoor: 1,
    };

    databaseService.insertLocation(point);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO LocationPoints'),
      [
        point.latitude,
        point.longitude,
        point.accuracy,
        point.speed,
        point.timestamp,
        point.isOutdoor,
      ],
    );

    const persistedPoint = { id: 7, ...point };
    mockExecute.mockReturnValueOnce({
      rows: {
        length: 1,
        item: (index: number) => index === 0 ? persistedPoint : undefined,
      },
    });

    expect(databaseService.getAllLocations()).toEqual([persistedPoint]);
  });

  it('deletes only the rows confirmed as uploaded', () => {
    databaseService.deleteLocations([3, 8]);

    expect(mockExecute).toHaveBeenCalledWith(
      'DELETE FROM LocationPoints WHERE id IN (?,?)',
      [3, 8],
    );
  });
});
