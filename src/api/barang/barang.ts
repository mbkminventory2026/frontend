import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type {
    BarangResponseItem
} from '@/schemas/barang/response';

export const getBarang = async (params: {
    limit?: number,
    offset?: number,
    page?: number,
    pageSize?: number,
    search?: string,
    sortBy?: string,
    sortDesc?: boolean
}) => {
    const response = await apiClient.get<BarangResponseItem[]>('/api/v1/master/barang', {
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

    return {
        results: response.data,
        count: Number(response.headers['x-total-count']) || response.data?.length || 0
    }
}

export const createBarang = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/master/barang', payload, { headers });
}

export const updateBarang = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/master/barang/${id}`, payload, { headers });
}

export const deleteBarang = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/master/barang/${id}`);
}

export const getBarangById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<BarangResponseItem[]>(`/api/v1/master/barang/${id}`);
    return response.data;
}
