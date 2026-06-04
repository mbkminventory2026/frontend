import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type { WarnaResponseItem } from '@/schemas/warna/response';

export const getWarna = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<WarnaResponseItem[]>('/api/v1/master/warna', {
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

export const createWarna = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/master/warna', payload, { headers });
}

export const updateWarna = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/master/warna/${id}`, payload, { headers });
}

export const deleteWarna = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/master/warna/${id}`);
}

export const getWarnaById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<WarnaResponseItem[]>(`/api/v1/master/warna/${id}`);
    return response.data;
}
