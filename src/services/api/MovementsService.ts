import api from './client';

export const MovementsService = {
  uploadMovements: async (filePath: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: `file://${filePath}`,
      name: 'movements.csv',
      type: 'text/csv',
    } as any);

    const response = await api.post('/movements/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
