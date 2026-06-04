import { apiClient } from "@/lib/apiClient";
import type { ProductionSummaryListResponse, WorkOrderOption } from "@/schemas/production/production";

export const getProductionSummary = async (params: {
  id_wo?: number;
  id_wo_shell_size?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get<ProductionSummaryListResponse>('/api/v1/production/summary', {
    params: {
      id_wo: params.id_wo,
      id_wo_shell_size: params.id_wo_shell_size,
      q: params.search,
      page: params.page,
      limit: params.limit,
    }
  });
  return response.data;
};

export const createFactoryReport = async (
  division: string,
  payload: { id_wo_shell_size: number; tanggal: string; qty: number }
) => {
  return await apiClient.post(`/api/v1/reports/${division}`, payload);
};

export const getWorkOrderList = async (): Promise<WorkOrderOption[]> => {
  const response = await apiClient.get<{ items: WorkOrderOption[]; pagination: any }>('/api/v1/work-orders', {
    params: { limit: 100 }
  });
  return response.data?.items || [];
};

