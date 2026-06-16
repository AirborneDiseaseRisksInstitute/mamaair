import api from './client';

export const DailyCheckinService = {
  checkExists: async (date: string): Promise<boolean> => {
    const response = await api.get('/daily-checkin/', { params: { date } });
    return response.data?.exists ?? false;
  },

  create: async (date: string): Promise<void> => {
    await api.post('/daily-checkin/', { date });
  },

  ensureCheckin: async (date: string): Promise<void> => {
    try {
      const exists = await DailyCheckinService.checkExists(date);
      if (!exists) {
        await DailyCheckinService.create(date);
      }
    } catch {
      // silently fail — don't block the user
    }
  },
};
