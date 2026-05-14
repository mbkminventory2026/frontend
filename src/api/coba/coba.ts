import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type {
    CobaListItem,
} from "@/schemas/coba/coba";

export const getCoba = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<CobaListItem[]>('/photos', {
        params: {
            _limit: params.limit,
            _start: params.offset,
            q: params.search
        }
    });

    return {
        results: response.data,
        count: Number(response.headers['x-total-count']) || 0
    }
}

export const createCoba = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/coba', payload, { headers });
}

export const updateCoba = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/coba/${id}`, payload, { headers });
}
