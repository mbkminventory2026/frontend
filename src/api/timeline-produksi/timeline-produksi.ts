import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase } from "@/lib/utils";

export const getTimelinePlans = async (params: {
    limit?: number,
    offset?: number,
    page?: number,
    pageSize?: number,
    search?: string,
    sortBy?: string,
    sortDesc?: boolean
}) => {
    const response = await apiClient.get<any>('/api/v1/timeline-plans', {
        params: {
            page: params.page,
            pageSize: params.pageSize ?? params.limit,
            limit: params.limit,
            offset: params.offset,
            q: params.search,
            sortBy: params.sortBy,
            sortDesc: params.sortDesc
        }
    })

    // Using the PaginatedResponse wrapper structure from backend
    return {
        results: response.data.items || [],
        count: response.data.pagination?.total_items || response.data.items?.length || 0
    }
}

export const createTimelinePlan = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    
    // Send as JSON
    return await apiClient.post('/api/v1/timeline-plans', snakeCaseValue);
}

export const getTimelinePlanById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<any>(`/api/v1/timeline-plans/${id}`);
    return response.data.data || response.data;
}

export const updateWOShellPlanStatus = async (idWOShellPlan: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)

    return await apiClient.patch(`/api/v1/timeline-plans/wo-shell-plans/${idWOShellPlan}/status`, snakeCaseValue);
}
