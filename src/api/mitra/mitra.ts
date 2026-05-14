import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type { MitraResponseItem } from '@/schemas/mitra/response';

export const getMitra = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<MitraResponseItem[]>('/api/v1/master/mitra', {
        params: {
            limit: params.limit,
            offset: params.offset,
            q: params.search
        }
    })

    return {
        results: response.data,
        count: Number(response.headers['x-total-count']) || response.data?.length || 0
    }
}

export const createMitra = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/master/mitra', payload, { headers });
}

export const updateMitra = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/master/mitra/${id}`, payload, { headers });
}

export const deleteMitra = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/master/mitra/${id}`);
}

export const getMitraById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<MitraResponseItem>(`/api/v1/master/mitra/${id}`);
    return response.data;
}
