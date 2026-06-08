import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase } from "@/lib/utils";
import type { CreateSpreadingCuttingPlanRequest } from "@/schemas/spreading-cutting-plan/request";
import type { SpreadingCuttingPlanResponse } from "@/schemas/spreading-cutting-plan/response";

export const createSpreadingCuttingPlan = async (data: CreateSpreadingCuttingPlanRequest) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data);
    const response = await apiClient.post<{ data: SpreadingCuttingPlanResponse }>('/api/v1/spreading-cutting-plans', snakeCaseValue);
    return response.data.data || response.data;
};

export const getSpreadingCuttingPlanById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.get<{ data: SpreadingCuttingPlanResponse }>(`/api/v1/spreading-cutting-plans/${id}`);
    return response.data.data || response.data;
};

export interface SpreadingCuttingPlanListItem {
  id_spreading_cutting_plan: number;
  no_dokumen: string;
  tanggal_efektif: string;
  id_wo: number;
  buyer: string;
  model: string;
  created_at: string;
}

export const getSpreadingCuttingPlans = async (params: {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}) => {
  const response = await apiClient.get<{
    items: SpreadingCuttingPlanListItem[];
    pagination: { total_items: number };
  }>("/api/v1/spreading-cutting-plans", {
    params: {
      page: params.page ?? (params.offset ?? 0) / (params.limit ?? 20) + 1,
      pageSize: params.pageSize ?? params.limit,
      limit: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      sortDesc: params.sortDesc,
    },
  });

  return {
    results: response.data.items || [],
    count:
      response.data.pagination?.total_items || response.data.items?.length || 0,
  };
};
