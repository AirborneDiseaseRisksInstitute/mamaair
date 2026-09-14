const mockCreateChannel = jest.fn(async () => 'health-reminders');
const mockCreateTriggerNotification = jest.fn(
  async (_notification: { id?: string }, _trigger: unknown) => undefined,
);
const mockCancelTriggerNotification = jest.fn(async () => undefined);
const mockGetNotificationSettings = jest.fn(async () => ({
  authorizationStatus: 1,
}));
const mockRequestPermission = jest.fn(async () => ({
  authorizationStatus: 1,
}));
const mockStorage = new Map<string, string>();

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: mockCreateChannel,
    createTriggerNotification: mockCreateTriggerNotification,
    cancelTriggerNotification: mockCancelTriggerNotification,
    getNotificationSettings: mockGetNotificationSettings,
    requestPermission: mockRequestPermission,
  },
  TriggerType: { TIMESTAMP: 0 },
  RepeatFrequency: { WEEKLY: 1 },
  AndroidImportance: { HIGH: 4 },
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  EventType: { PRESS: 1 },
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: (key: string) => mockStorage.get(key),
    set: (key: string, value: string) => mockStorage.set(key, value),
    remove: (key: string) => mockStorage.delete(key),
  }),
}));

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: {
    getState: () => ({ profile: {} }),
  },
}));

type NotificationServiceModule = typeof import('../src/services/NotificationService');

let cancelCategoryReminder: NotificationServiceModule['cancelCategoryReminder'];
let getCategoryReminderSettings: NotificationServiceModule['getCategoryReminderSettings'];
let nextWeeklyReminderTimestamp: NotificationServiceModule['nextWeeklyReminderTimestamp'];
let scheduleCategoryReminder: NotificationServiceModule['scheduleCategoryReminder'];

describe('local notification scheduling', () => {
  beforeAll(() => {
    const service = require('../src/services/NotificationService') as NotificationServiceModule;
    cancelCategoryReminder = service.cancelCategoryReminder;
    getCategoryReminderSettings = service.getCategoryReminderSettings;
    nextWeeklyReminderTimestamp = service.nextWeeklyReminderTimestamp;
    scheduleCategoryReminder = service.scheduleCategoryReminder;
  });

  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
    mockGetNotificationSettings.mockResolvedValue({
      authorizationStatus: 1,
    });
    mockRequestPermission.mockResolvedValue({
      authorizationStatus: 1,
    });
  });

  it('uses the next selected weekday at the requested local time', () => {
    const now = new Date(2026, 8, 10, 10, 30, 0);
    const timestamp = nextWeeklyReminderTimestamp(now, 5, 9, 15);
    const scheduled = new Date(timestamp);

    expect(scheduled.getDay()).toBe(5);
    expect(scheduled.getHours()).toBe(9);
    expect(scheduled.getMinutes()).toBe(15);
    expect(timestamp).toBeGreaterThan(now.getTime());
  });

  it('moves today to next week when the selected time has passed', () => {
    const now = new Date(2026, 8, 10, 10, 30, 0);
    const timestamp = nextWeeklyReminderTimestamp(
      now,
      now.getDay(),
      9,
      15,
    );
    const scheduled = new Date(timestamp);

    expect(scheduled.getDate()).toBe(now.getDate() + 7);
    expect(scheduled.getHours()).toBe(9);
    expect(scheduled.getMinutes()).toBe(15);
  });

  it('keeps today when the selected time is still ahead', () => {
    const now = new Date(2026, 8, 10, 10, 30, 0);
    const timestamp = nextWeeklyReminderTimestamp(
      now,
      now.getDay(),
      18,
      45,
    );
    const scheduled = new Date(timestamp);

    expect(scheduled.getDate()).toBe(now.getDate());
    expect(scheduled.getHours()).toBe(18);
    expect(scheduled.getMinutes()).toBe(45);
  });

  it('persists a wellbeing reminder and creates one weekly trigger per selected day', async () => {
    const status = await scheduleCategoryReminder({
      category: 'wellbeing',
      hour: 18,
      minute: 30,
      body: 'Time for your mental wellbeing reminder.',
      days: '1111111',
    });

    expect(status).toBe('scheduled');
    expect(mockCreateTriggerNotification).toHaveBeenCalledTimes(7);
    expect(
      mockCreateTriggerNotification.mock.calls.map(
        ([notification]) => notification.id,
      ),
    ).toEqual([
      'category_wellbeing_0',
      'category_wellbeing_1',
      'category_wellbeing_2',
      'category_wellbeing_3',
      'category_wellbeing_4',
      'category_wellbeing_5',
      'category_wellbeing_6',
    ]);
    expect(getCategoryReminderSettings().wellbeing).toMatchObject({
      hour: 18,
      minute: 30,
      status: 'scheduled',
    });
  });

  it('keeps the selected time as pending when notification permission is denied', async () => {
    mockGetNotificationSettings.mockResolvedValue({
      authorizationStatus: 0,
    });
    mockRequestPermission.mockResolvedValue({
      authorizationStatus: 0,
    });

    const status = await scheduleCategoryReminder({
      category: 'diet',
      hour: 12,
      minute: 15,
      body: 'Time for your nutrition reminder.',
      days: '1111111',
    });

    expect(status).toBe('permissionDenied');
    expect(mockCreateTriggerNotification).not.toHaveBeenCalled();
    expect(getCategoryReminderSettings().diet?.status).toBe(
      'needsPermission',
    );
  });

  it('keeps the selected time pending when no notification day is selected', async () => {
    const status = await scheduleCategoryReminder({
      category: 'activity',
      hour: 14,
      minute: 0,
      body: 'Time for your activity reminder.',
      days: '0000000',
    });

    expect(status).toBe('noDaysSelected');
    expect(mockCreateTriggerNotification).not.toHaveBeenCalled();
    expect(getCategoryReminderSettings().activity?.status).toBe('needsDays');
  });

  it('removes the persisted setting and every weekday trigger', async () => {
    await scheduleCategoryReminder({
      category: 'behavior',
      hour: 9,
      minute: 0,
      body: 'Time for your behaviour reminder.',
      days: '1111111',
    });
    mockCancelTriggerNotification.mockClear();

    await cancelCategoryReminder('behavior');

    expect(mockCancelTriggerNotification).toHaveBeenCalledTimes(7);
    expect(getCategoryReminderSettings().behavior).toBeUndefined();
  });
});
