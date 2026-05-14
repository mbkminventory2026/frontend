import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type { DepartemenResponseItem } from '@/schemas/departemen/response';

export const getDepartemen = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<DepartemenResponseItem[]>('/api/v1/master/departemen', {
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

export const createDepartemen = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/master/departemen', payload, { headers });
}

export const updateDepartemen = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/master/departemen/${id}`, payload, { headers });
}

export const deleteDepartemen = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/master/departemen/${id}`);
}

export const getDepartemenById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<DepartemenResponseItem>(`/api/v1/master/departemen/${id}`);
    return response.data;
}
