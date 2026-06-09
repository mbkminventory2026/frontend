import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type {
    ReportPenerimaanItem
} from "@/schemas/reportPenerimaan/reportPenerimaan";

export const getReportPenerimaan = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<any>('/api/v1/received', {
        params: {
            limit: params.limit,
            offset: params.offset,
            q: params.search
        }
    });

    const listData = response.data;
    const items = listData?.items ?? listData;
    const total = listData?.pagination?.total_items ?? Number(response.headers['x-total-count']) ?? items?.length ?? 0;
    return {
        results: items,
        count: total
    }
}

export const createReportPenerimaan = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/received', payload, { headers });
}

export const updateReportPenerimaan = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/received/${id}`, payload, { headers });
}

export const deleteReportPenerimaan = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/received/${id}`);
}

export const getReportPenerimaanById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<ReportPenerimaanItem[]>(`/api/v1/received/${id}`);
    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
}
