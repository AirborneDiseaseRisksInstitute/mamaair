import api from './client'

export const DailyCheckinService = {
  checkin: async (date: string): Promise<{ id: number; date: string; created_at: string }> => {
    const response = await api.post('/daily-checkin/', { date })
    return response.data
  },
}
