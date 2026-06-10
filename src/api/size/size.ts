import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type { SizeResponseItem } from "@/schemas/size/response";

export const getSize = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<SizeResponseItem[]>('/api/v1/master/sizes', {
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

export const createSize = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/master/sizes', payload, { headers });
}

export const updateSize = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/master/sizes/${id}`, payload, { headers });
}

export const deleteSize = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/master/sizes/${id}`);
}

export const getSizeById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<SizeResponseItem>(`/api/v1/master/sizes/${id}`);
    return response.data;
}
