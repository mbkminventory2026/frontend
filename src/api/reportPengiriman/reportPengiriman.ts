import { apiClient } from "@/lib/apiClient";
import type {
    ReportPengirimanItem
} from "@/schemas/reportPengiriman/reportPengiriman";

export const getReportPengiriman = async(params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    const response = await apiClient.get<ReportPengirimanItem[]>('/api/v1/report-pengiriman', {
        params: {
            limit: params.limit,
            offset: params.offset,
            q: params.search
        }
    });

    return {
        results: response.data,
        count: Number(response.headers['x-total-count']) || response.data?.length || 0
    }
}

export const deleteReportPengiriman = async (id: string | number) => {
    if (!id) throw new Error("ID is required for deletion");
    
    return await apiClient.delete(`/api/v1/report-pengiriman/${id}`);
}