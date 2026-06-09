import { apiClient } from '@/lib/apiClient';

export interface ProductionLine {
  id_production_line: number;
  name: string;
  created_at: string;
}

export interface ProductionStatusPlan {
  id_production_status_plan: number;
  name: string;
  created_at: string;
}

export const getProductionLines = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}): Promise<{ results: ProductionLine[]; count: number }> => {
  const response = await apiClient.get('/api/v1/master/production-lines', {
    params: {
      page: params?.page,
      limit: params?.limit || 1000,
      q: params?.search,
      sortBy: params?.sortBy,
      sortDesc: params?.sortDesc,
    },
  });
  const data = response.data;
  return {
    results: Array.isArray(data) ? data : (data?.data || []),
    count: parseInt(response.headers['x-total-count'] || '0'),
  };
};

export const getProductionStatusPlans = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}): Promise<{ results: ProductionStatusPlan[]; count: number }> => {
  const response = await apiClient.get('/api/v1/master/production-status-plans', {
    params: {
      page: params?.page,
      limit: params?.limit || 1000,
      q: params?.search,
      sortBy: params?.sortBy,
      sortDesc: params?.sortDesc,
    },
  });
  const data = response.data;
  return {
    results: Array.isArray(data) ? data : (data?.data || []),
    count: parseInt(response.headers['x-total-count'] || '0'),
  };
};
