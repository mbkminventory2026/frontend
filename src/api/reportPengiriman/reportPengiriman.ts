import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type {
    ReportPengirimanItem
} from "@/schemas/reportPengiriman/reportPengiriman";

export const getReportPengiriman = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<ReportPengirimanItem[]>('/api/v1/report-pengiriman', {
        params: {
            limit: params.limit,
            offset: params.offset,
            q: params.search
        }
    });

    return {
        results: response.data,
        count: Number(response.headers['x-total-count']) || response.data?.length || 0
    }
}

export const createReportPengiriman = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/report-pengiriman', payload, { headers });
}

export const updateReportPengiriman = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/report-pengiriman/${id}`, payload, { headers });
}

export const deleteReportPengiriman = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/report-pengiriman/${id}`);
}

export const getReportPengirimanById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<ReportPengirimanItem[]>(`/api/v1/report-pengiriman/${id}`);
    return response.data;
}