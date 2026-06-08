import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase } from "@/lib/utils";
import type { CreateMarkerPlanRequest } from "@/schemas/marker-plan/request";
import type { MarkerPlanResponse } from "@/schemas/marker-plan/response";

export const createMarkerPlan = async (data: CreateMarkerPlanRequest) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data);
    const response = await apiClient.post<{ data: MarkerPlanResponse }>('/api/v1/marker-plans', snakeCaseValue);
    return response.data.data || response.data;
};

export const getMarkerPlanById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.get<{ data: MarkerPlanResponse }>(`/api/v1/marker-plans/${id}`);
    return response.data.data || response.data;
};

export interface MarkerPlanListItem {
  id_marker_plan: number;
  no_dokumen: string;
  tanggal_efektif: string;
  id_wo_shell: number;
  deskripsi: string;
  color: string;
  id_wo: number;
  buyer: string;
  model: string;
  created_at: string;
}

export const getMarkerPlans = async (params: {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}) => {
  const response = await apiClient.get<{
    items: MarkerPlanListItem[];
    pagination: { total_items: number };
  }>("/api/v1/marker-plans", {
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
