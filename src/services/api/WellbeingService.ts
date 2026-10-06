import api from './client';

export interface WellbeingCatalogItem {
  id: number;
  name: string;
  emoji?: string;
}

export interface WellbeingCatalog {
  water_goal_ml?: number;
  water_goal_unit?: 'ml';
  moods: WellbeingCatalogItem[];
  feelings: WellbeingCatalogItem[];
}

export interface WellbeingLog {
  date: string;
  water_amount: number;
  water_unit?: 'ml';
  mood_ids: number[];
  feeling_ids: number[];
}

const volumeInMl = (value: unknown, unit: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalizedUnit = String(unit ?? 'ml').trim().toLowerCase();
  if (
    ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(
      normalizedUnit,
    )
  ) {
    return value;
  }
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(normalizedUnit)) {
    return value * 1000;
  }
  return null;
};

const parseWellbeingLog = (data: any, fallbackDate: string): WellbeingLog => {
  const waterAmountMl = volumeInMl(
    data?.water_amount ?? 0,
    data?.water_unit,
  );
  if (waterAmountMl === null) {
    throw new Error('Unsupported wellbeing water unit');
  }

  return {
    date: data?.date ?? fallbackDate,
    water_amount: waterAmountMl,
    water_unit: 'ml',
    mood_ids: (data?.moods || []).map((m: any) =>
      typeof m === 'number' ? m : m.id,
    ),
    feeling_ids: (data?.feelings || []).map((f: any) =>
      typeof f === 'number' ? f : f.id,
    ),
  };
};

export const WellbeingService = {
  getCatalog: async (): Promise<WellbeingCatalog> => {
    const response = await api.get('/wellbeing/');
    const data = response.data;
    const waterGoalMl = volumeInMl(
      data.water_goal?.value,
      data.water_goal?.unit,
    );
    return {
      water_goal_ml: waterGoalMl ?? undefined,
      water_goal_unit: waterGoalMl === null ? undefined : 'ml',
      moods: (data.moods || []).map((m: any) => ({ id: m.id, name: m.title, emoji: m.emoji })),
      feelings: (data.feelings || []).map((f: any) => ({ id: f.id, name: f.title, emoji: f.emoji })),
    };
  },

  getLog: async (date: string): Promise<WellbeingLog | null> => {
    try {
      return await WellbeingService.getLogStrict(date);
    } catch {
      return null;
    }
  },

  getLogStrict: async (date: string): Promise<WellbeingLog> => {
    const response = await api.get('/wellbeing/log/', { params: { date } });
    return parseWellbeingLog(response.data, date);
  },

  saveLog: async (data: WellbeingLog): Promise<void> => {
    await api.post('/wellbeing/log/', { ...data, water_unit: 'ml' });
  },
};
