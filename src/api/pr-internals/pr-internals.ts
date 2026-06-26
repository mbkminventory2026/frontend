import { apiClient } from "@/lib/apiClient";

export interface PRInternalItemResponse {
    id_pr_internal_item?: number;
    item: string;
    description?: string;
    qty: number;
    unit: string;
    est_price: number;
    created_at?: string;
}

export interface PRInternalListItem {
    id_pr_internal: number;
    nama: string;
    tanggal: string;
    departemen: string;
    vendor_name: string;
    projek: string;
    status: string;
    id_wo: number;
    id_user: number;
    created_at: string;
}

export interface PRInternalDetailResponse {
    id_pr_internal: number;
    nama: string;
    tanggal: string;
    departemen: string;
    vendor_name: string;
    vendor_address: string;
    vendor_telp: string;
    projek: string;
    status: string;
    id_wo: number;
    id_user: number;
    approved_at?: string;
    approved_by_user_id?: number;
    created_at: string;
    items: PRInternalItemResponse[];
}

export interface PRInternalStatusResponse {
    id_pr_internal: number;
    status: string;
    approved_at?: string;
    approved_by_user_id?: number;
}

export const getPRInternals = async (params: {
    limit: number;
    offset: number;
    search?: string;
}) => {
    const response = await apiClient.get<{ items: PRInternalListItem[]; pagination: { total_items: number } }>('/api/v1/pr-internals', {
        params: {
            limit: params.limit,
            page: Math.floor(params.offset / params.limit) + 1,
            search: params.search
        }
    });

    return {
        results: response.data.items || [],
        count: response.data.pagination?.total_items || response.data.items?.length || 0
    };
};

export const getPRInternalById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.get<{ data: PRInternalDetailResponse }>(`/api/v1/pr-internals/${id}`);
    return (response.data as any).data || response.data;
};

export const createPRInternal = async (data: {
    tanggal: string;
    nama: string;
    departemen: string;
    vendor_name: string;
    vendor_address?: string;
    vendor_telp?: string;
    projek: string;
    id_wo: number;
    items: {
        item: string;
        description?: string;
        qty: number;
        unit: string;
        est_price: number;
    }[];
}) => {
    return await apiClient.post('/api/v1/pr-internals', data);
};

export const approvePRInternal = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.patch<{ data: PRInternalStatusResponse }>(`/api/v1/pr-internals/${id}/approve`);
    return (response.data as any).data || response.data;
};

export const downloadPRInternalExcel = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get(`/api/v1/pr-internals/${id}/export/excel`, {
        responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"] as string | undefined;
    const matchedFileName = contentDisposition?.match(/filename="([^"]+)"/i);
    const fileName = matchedFileName?.[1] || `pr-internal-${id}.xlsx`;

    return {
        blob: response.data as Blob,
        fileName,
    };
};

/** Fetch all approved PR Internals for use in dropdowns */
export const getApprovedPRInternals = async () => {
    const response = await apiClient.get<{ items: PRInternalListItem[]; pagination: { total_items: number } }>('/api/v1/pr-internals', {
        params: { limit: 200, page: 1 }
    });
    const items = response.data.items || [];
    return items.filter(item => item.status?.toLowerCase() === 'approved');
};
