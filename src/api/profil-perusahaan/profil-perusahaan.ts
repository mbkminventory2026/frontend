import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase } from "@/lib/utils";
import type {
    ProfilPerusahaanResponseItem
} from '@/schemas/profil-perusahaan/response';

/**
 * Clean payload from null or undefined values
 */
const cleanPayload = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null || cleaned[key] === undefined) {
            delete cleaned[key];
        }
    });
    return cleaned;
}

/**
 * Convert File to Base64
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

/**
 * Process payload to handle files as base64 if needed
 */
const processPayload = async (data: any) => {
    const cleaned = cleanPayload(data);
    const snakeCaseValue = mapPayloadToSnakeCase(cleaned);
    
    // Check for files and convert to base64
    const keys = Object.keys(snakeCaseValue);
    for (const key of keys) {
        const val = snakeCaseValue[key];
        if (val instanceof File) {
            snakeCaseValue[key] = await fileToBase64(val);
        } else if (Array.isArray(val) && val[0] instanceof File) {
            snakeCaseValue[key] = await fileToBase64(val[0]);
        }
    }
    
    return snakeCaseValue;
}

export const getProfilPerusahaan = async (params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<ProfilPerusahaanResponseItem[]>('/api/v1/profil-perusahaan', {
        params: {
            limit: params.limit,
            offset: params.offset,
            q: params.search
        }
    })

    console.log('getProfilPerusahaan response:', response.data);

    return {
        results: response.data,
        count: Number(response.headers['x-total-count']) || (Array.isArray(response.data) ? response.data.length : (response.data ? 1 : 0))
    }
}

export const createProfilPerusahaan = async (data: any) => {
    const payload = await processPayload(data);
    console.log('Final Create Payload:', payload);
    return await apiClient.post('/api/v1/profil-perusahaan', payload);
}

export const updateProfilPerusahaan = async (id: string | number, data: any) => {
    const payload = await processPayload(data);
    return await apiClient.put(`/api/v1/profil-perusahaan/${id}`, payload);
}

export const deleteProfilPerusahaan = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");

    return await apiClient.delete(`/api/v1/profil-perusahaan/${id}`);
}

export const getProfilPerusahaanById = async (id: string | number) => {
    if (!id) throw new Error("ID is required");

    const response = await apiClient.get<ProfilPerusahaanResponseItem[]>(`/api/v1/profil-perusahaan/${id}`);
    const data = response.data;
    return Array.isArray(data) ? data[0] : data;
}
