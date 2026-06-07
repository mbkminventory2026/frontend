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
