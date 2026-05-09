import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase, hasFile, prepareFormData } from "@/lib/utils";
import type { PermissionsResponseItem } from '@/schemas/permissions/response';

export const getPermissions = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<PermissionsResponseItem[]>('/api/v1/master/permissions', {
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

export const createPermissions = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)
    
    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.post('/api/v1/master/permissions', payload, { headers });
}

export const updatePermissions = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    const containsFile = hasFile(snakeCaseValue)
    
    const payload = containsFile ? prepareFormData(snakeCaseValue) : snakeCaseValue
    const headers = containsFile ? { 'Content-Type': 'multipart/form-data' } : {}

    return await apiClient.patch(`/api/v1/master/permissions/${id}`, payload, { headers });
}

export const deletePermissions = async (id: string | number) => {
    if(!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/master/permissions/${id}`);
}

export const getPermissionsById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<PermissionsResponseItem>(`/api/v1/master/permissions/${id}`);
    return response.data;
}
