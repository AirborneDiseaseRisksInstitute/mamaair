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
  AlarmType: { SET_AND_ALLOW_WHILE_IDLE: 1 },
  RepeatFrequency: { WEEKLY: 1 },
  AndroidImportance: { HIGH: 4 },
  AndroidVisibility: { PRIVATE: 0 },
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
let nextCategoryReminderTimestamp: NotificationServiceModule['nextCategoryReminderTimestamp'];
let nextWeeklyReminderTimestamp: NotificationServiceModule['nextWeeklyReminderTimestamp'];
let nextActionReminderDate: NotificationServiceModule['nextActionReminderDate'];
let scheduleCategoryReminder: NotificationServiceModule['scheduleCategoryReminder'];
let scheduleActionReminder: NotificationServiceModule['scheduleActionReminder'];

describe('local notification scheduling', () => {
  beforeAll(() => {
    const service = require('../src/services/NotificationService') as NotificationServiceModule;
    cancelCategoryReminder = service.cancelCategoryReminder;
    getCategoryReminderSettings = service.getCategoryReminderSettings;
    nextCategoryReminderTimestamp = service.nextCategoryReminderTimestamp;
    nextWeeklyReminderTimestamp = service.nextWeeklyReminderTimestamp;
    nextActionReminderDate = service.nextActionReminderDate;
    scheduleCategoryReminder = service.scheduleCategoryReminder;
    scheduleActionReminder = service.scheduleActionReminder;
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

  it('finds the next enabled category reminder for relative feedback', () => {
    const now = new Date(2026, 8, 10, 10, 30, 0);
    const today = now.getDay();
    const tomorrow = (today + 1) % 7;
    const days = Array.from({ length: 7 }, () => '0');
    days[today] = '1';
    days[tomorrow] = '1';

    const timestamp = nextCategoryReminderTimestamp(
      now,
      days.join(''),
      11,
      0,
    );

    expect(timestamp).toBe(new Date(2026, 8, 10, 11, 0, 0).getTime());
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

  it('keeps an action reminder at the explicitly requested time', () => {
    const now = new Date(2026, 8, 10, 10, 30, 0);
    const scheduled = nextActionReminderDate('2026-09-10', 22, 15, now);

    expect(scheduled.getDate()).toBe(now.getDate());
    expect(scheduled.getHours()).toBe(22);
    expect(scheduled.getMinutes()).toBe(15);
  });

  it('moves a passed action reminder to tomorrow at the requested time', () => {
    const now = new Date(2026, 8, 10, 22, 30, 0);
    const scheduled = nextActionReminderDate('2026-09-10', 21, 15, now);

    expect(scheduled.getDate()).toBe(now.getDate() + 1);
    expect(scheduled.getHours()).toBe(21);
    expect(scheduled.getMinutes()).toBe(15);
  });

  it('uses an audible channel and AlarmManager for action reminders', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 10, 10, 30, 0));

    try {
      const result = await scheduleActionReminder({
        date: '2026-09-10',
        actionKey: 'drink-water',
        title: 'Drink water',
        hour: 11,
        minute: 30,
      });

      expect(result.status).toBe('scheduled');
      expect(mockCreateChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mamaair_reminders_v2',
          sound: 'default',
          vibration: true,
        }),
      );
      expect(mockCreateTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          android: expect.objectContaining({ sound: 'default' }),
        }),
        expect.objectContaining({
          timestamp: new Date(2026, 8, 10, 11, 30, 0).getTime(),
          alarmManager: { type: 1 },
        }),
      );
    } finally {
      jest.useRealTimers();
    }
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
