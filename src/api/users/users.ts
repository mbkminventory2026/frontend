import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase } from "@/lib/utils";

export interface UserResponseItem {
    id_user: number;
    username: string;
    id_role: number;
    nama_role: string;
    status: string;
    id_departemen?: number;
    id_mitra?: number;
    nama_departemen?: string;
    nama_perusahaan?: string;
    created_at: string;
    must_change_password?: boolean;
    password_changed_at?: string;
    temporary_password?: string;
    hak_akses_ids?: number[];
}

export const getUsers = async (params: {
    limit?: number,
    offset?: number,
    page?: number,
    pageSize?: number,
    search?: string,
    sortBy?: string,
    sortDesc?: boolean
}) => {
    const response = await apiClient.get<UserResponseItem[]>('/api/v1/users', {
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

export const createUser = async (data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    return await apiClient.post('/api/v1/users', snakeCaseValue);
}

export const updateUser = async (id: string | number, data: any) => {
    const snakeCaseValue = mapPayloadToSnakeCase(data)
    return await apiClient.put(`/api/v1/users/${id}`, snakeCaseValue);
}

export const deleteUser = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");
    return await apiClient.delete(`/api/v1/users/${id}`);
}

export const getUserById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.get<UserResponseItem>(`/api/v1/users/${id}`);
    return response.data;
}

export const approveUser = async (id: string | number) => {
    if (!id) throw new Error("ID is required for approval");
    const response = await apiClient.put(`/api/v1/users/${id}/approve`);
    return response.data;
}

export const rejectUser = async (id: string | number) => {
    if (!id) throw new Error("ID is required for rejection");
    const response = await apiClient.put(`/api/v1/users/${id}/reject`);
    return response.data;
}

export const assignUserRole = async (idUser: string | number, idRole: number) => {
    if (!idUser) throw new Error("User ID is required");
    const response = await apiClient.put(`/api/v1/users/${idUser}/role`, { id_role: idRole });
    return response.data;
}
