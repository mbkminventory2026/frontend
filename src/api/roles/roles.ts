import { apiClient } from "@/lib/apiClient";
import type { RolesResponseItem } from '@/schemas/roles/response';

export interface RoleListItem {
    id_role: number;
    nama_role: string;
    created_at: string;
}

export interface RoleDetailItem extends RolesResponseItem {
    permissions?: string[];
    hak_akses_ids?: number[];
}

export const getRoles = async (params: {
    limit?: number,
    offset?: number,
    page?: number,
    pageSize?: number,
    search?: string,
    sortBy?: string,
    sortDesc?: boolean
}) => {
    const response = await apiClient.get('/api/v1/roles', {
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

    const data = response.data
    return {
        results: data.items || data || [],
        count: data.pagination?.total || Number(response.headers['x-total-count']) || (data.items || data || []).length
    }
}

export const getRoleById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.get<RoleDetailItem>(`/api/v1/roles/${id}`);
    return response.data;
}

export const createRole = async (data: { nama_role: string, hak_akses_ids: number[] }) => {
    return await apiClient.post('/api/v1/roles', data);
}

export const updateRole = async (id: string | number, data: { nama_role: string, hak_akses_ids: number[] }) => {
    return await apiClient.put(`/api/v1/roles/${id}`, data);
}

export const deleteRole = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");
    return await apiClient.delete(`/api/v1/roles/${id}`);
}
