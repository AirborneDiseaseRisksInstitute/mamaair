import api from './client';
import { appLogger } from '../logger/AppLogger';

interface MovementPoint {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO 8601
}

export const MovementsService = {
  // New JSON endpoint (no file/FormData hassle)
  uploadMovementsJson: async (movements: MovementPoint[]) => {
    appLogger.info('Upload', `Uploading ${movements.length} points as JSON`);

    try {
      const response = await api.post('/movements/upload/json/', {
        movements,
      }, { timeout: 30000 });
      appLogger.info('Upload', `SUCCESS status=${response.status}`);
      return response.data;
    } catch (error: any) {
      appLogger.error('Upload', `FAILED: ${error?.message} status=${error?.response?.status} data=${JSON.stringify(error?.response?.data)}`);
      throw error;
    }
  },
};
