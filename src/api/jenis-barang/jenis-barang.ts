import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type { JenisBarangResponseItem } from '@/schemas/jenis-barang/response';

export const getJenisBarang = async (params: {
    limit?: number,
    offset?: number,
    page?: number,
    pageSize?: number,
    search?: string,
    sortBy?: string,
    sortDesc?: boolean
} = {}) => {
    const response = await apiClient.get<JenisBarangResponseItem[]>('/api/v1/master/jenis-barang', {
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

export const createJenisBarang = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/master/jenis-barang', payload, { headers });
}

export const updateJenisBarang = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)

    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.put(`/api/v1/master/jenis-barang/${id}`, payload, { headers });
}

export const deleteJenisBarang = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/master/jenis-barang/${id}`);
}

export const getJenisBarangById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<JenisBarangResponseItem>(`/api/v1/master/jenis-barang/${id}`);
    return response.data;
}
