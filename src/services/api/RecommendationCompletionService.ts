import api from './client';

export interface RecommendationCompletion {
  id: number;
  snapshot_id: number;
  rule_id: string;
  rule_version: number;
  dimension: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const RecommendationCompletionService = {
  getCompletions: async (snapshotId: number): Promise<RecommendationCompletion[]> => {
    const response = await api.get('/recommendation-completion/', { params: { snapshot_id: snapshotId } });
    return response.data || [];
  },

  markDone: async (data: {
    snapshot_id: number;
    rule_id: string;
    rule_version: number;
    dimension: string;
    status: 'done' | 'pending';
  }): Promise<void> => {
    await api.post('/recommendation-completion/', data);
  },
};
