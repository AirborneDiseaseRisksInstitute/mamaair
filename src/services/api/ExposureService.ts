import api from './client';

export interface AirExposure {
  id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  aqi: number;
  temperature: number;
  humidity: number;
  pressure: number;
  uvi: number;
  uvi_level: string;
  wind_speed: number;
  exposure_minutes: number;
  activity_level: string;
  indoor: boolean;
}

export const ExposureService = {
  getAirExposure: async (): Promise<AirExposure | null> => {
    const response = await api.get('/air-exposure/');
    return response.data || null;
  },

  getExposureHistory: async (days: number = 7) => {
    const response = await api.get('/exposure/history/', { params: { days } });
    return response.data;
  },
};
