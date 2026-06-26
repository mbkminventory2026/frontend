import { apiClient } from "@/lib/apiClient";

export interface POInternalItemResponse {
    id_po_internal_item?: number;
    item: string;
    description?: string;
    qty: number;
    unit: string;
    unit_price: number;
    created_at?: string;
}

export interface POInternalListItem {
    id_po_internal: number;
    nama_po: string;
    tanggal: string;
    supplier_name: string;
    currency: string;
    ship_date: string;
    id_pr_internal: number;
    created_at: string;
}

export interface POInternalDetailResponse {
    id_po_internal: number;
    tanggal: string;
    nama_po: string;
    supplier_name: string;
    supplier_addr: string;
    supplier_contact: string;
    supplier_email: string;
    supplier_telp: string;
    supplier_fax: string;
    currency: string;
    cpo: string;
    term: string;
    ship_date: string;
    id_pr_internal: number;
    created_at: string;
    items: POInternalItemResponse[];
}

export const getPOInternals = async (params: {
    limit: number;
    offset: number;
    search?: string;
}) => {
    const response = await apiClient.get<{ items: POInternalListItem[]; pagination: { total_items: number } }>('/api/v1/po-internals', {
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

export const createPOInternal = async (data: {
    tanggal: string;
    nama_po: string;
    supplier_name: string;
    supplier_addr?: string;
    supplier_contact?: string;
    supplier_email?: string;
    supplier_telp?: string;
    supplier_fax?: string;
    currency: string;
    cpo?: string;
    term?: string;
    ship_date: string;
    id_pr_internal: number;
    items: {
        item: string;
        description?: string;
        qty: number;
        unit: string;
        unit_price: number;
    }[];
}) => {
    return await apiClient.post('/api/v1/po-internals', data);
};

export const getPOInternalById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.get<{ data: POInternalDetailResponse }>(`/api/v1/po-internals/${id}`);
    return (response.data as any).data || response.data;
};

export const downloadPOInternalExcel = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get(`/api/v1/po-internals/${id}/export/excel`, {
        responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"] as string | undefined;
    const matchedFileName = contentDisposition?.match(/filename="([^"]+)"/i);
    const fileName = matchedFileName?.[1] || `po-internal-${id}.xlsx`;

    return {
        blob: response.data as Blob,
        fileName,
    };
};
