import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase } from "@/lib/utils";

export interface POClientItemResponse {
    id_po_client_item?: number;
    style: string;
    colour: string;
    description?: string;
    qty: number;
    price: number;
    created_at?: string;
}

export interface PenanggungJawabResponse {
    id_penanggung_jawab?: number;
    nama: string;
    no_telp: string;
    email?: string;
    created_at?: string;
}

export interface POClientListItem {
    id_po_client: number;
    po_number: string;
    tanggal: string;
    season: string;
    delivery: string;
    id_mitra: number;
    mitra_name: string;
    created_at: string;
}

export interface POClientDetailResponse {
    id_po_client: number;
    po_number: string;
    tanggal: string;
    season: string;
    delivery: string;
    payment_term: string;
    file: string;
    id_mitra: number;
    mitra_name: string;
    created_at: string;
    items: POClientItemResponse[];
    penanggung_jawab: PenanggungJawabResponse[];
}

export const getPOClients = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<{ items: POClientListItem[], pagination: { total_items: number } }>('/api/v1/po-clients', {
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

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

export const createPOClient = async (data: any) => {
    if (data.tanggal && data.tanggal.includes('T')) {
        data.tanggal = data.tanggal.split('T')[0];
    }
    if (data.delivery && data.delivery.includes('T')) {
        data.delivery = data.delivery.split('T')[0];
    }
    
    // Check if file is a File object and convert to base64
    if (data.file instanceof File) {
        data.file = await fileToBase64(data.file);
    }
    
    const snakeCaseValue = mapPayloadToSnakeCase(data);
    return await apiClient.post('/api/v1/po-clients', snakeCaseValue);
};

export const updatePOClient = async (id: string | number, data: any) => {
    if (data.tanggal && data.tanggal.includes('T')) {
        data.tanggal = data.tanggal.split('T')[0];
    }
    if (data.delivery && data.delivery.includes('T')) {
        data.delivery = data.delivery.split('T')[0];
    }
    
    // Check if file is a File object and convert to base64
    if (data.file instanceof File) {
        data.file = await fileToBase64(data.file);
    }
    
    const snakeCaseValue = mapPayloadToSnakeCase(data);
    return await apiClient.put(`/api/v1/po-clients/${id}`, snakeCaseValue);
};

export const getPOClientById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");
    const response = await apiClient.get<{ data: POClientDetailResponse }>(`/api/v1/po-clients/${id}`);
    return (response.data as any).data || response.data;
};
