import { apiClient } from '@/lib/apiClient';

export interface ProductionLine {
    id_production_line: number;
    name: string;
    created_at: string;
}

export interface ProductionStatusPlan {
    id_production_status_plan: number;
    name: string;
    created_at: string;
}

// PRODUCTION LINE API

export const getProductionLines = async (params?: { page?: number, limit?: number, search?: string, sortBy?: string, sortDesc?: boolean }): Promise<{ results: ProductionLine[], count: number }> => {
    const response = await apiClient.get('/api/v1/master/production-lines', {
        params: {
            page: params?.page,
            limit: params?.limit || 1000,
            q: params?.search,
            sortBy: params?.sortBy,
            sortDesc: params?.sortDesc
        }
    });
    const data = response.data;
    return {
        results: Array.isArray(data) ? data : (data?.data || []),
        count: parseInt(response.headers['x-total-count'] || '0')
    };
};

export const getProductionLineById = async (id: number | string): Promise<ProductionLine> => {
    const response = await apiClient.get(`/api/v1/master/production-lines/${id}`);
    const data = response.data;
    return Array.isArray(data) ? data[0] : (data?.data || data);
}

export const createProductionLine = async (data: any): Promise<ProductionLine> => {
    const response = await apiClient.post('/api/v1/master/production-lines', data);
    return response.data?.data;
}

export const updateProductionLine = async (id: number | string, data: any): Promise<ProductionLine> => {
    const response = await apiClient.put(`/api/v1/master/production-lines/${id}`, data);
    return response.data?.data;
}

export const deleteProductionLine = async (id: number | string): Promise<void> => {
    await apiClient.delete(`/api/v1/master/production-lines/${id}`);
}

// PRODUCTION STATUS PLAN API

export const getProductionStatusPlans = async (params?: { page?: number, limit?: number, search?: string, sortBy?: string, sortDesc?: boolean }): Promise<{ results: ProductionStatusPlan[], count: number }> => {
    const response = await apiClient.get('/api/v1/master/production-status-plans', {
        params: {
            page: params?.page,
            limit: params?.limit || 1000,
            q: params?.search,
            sortBy: params?.sortBy,
            sortDesc: params?.sortDesc
        }
    });
    const data = response.data;
    return {
        results: Array.isArray(data) ? data : (data?.data || []),
        count: parseInt(response.headers['x-total-count'] || '0')
    };
};

export const getProductionStatusPlanById = async (id: number | string): Promise<ProductionStatusPlan> => {
    const response = await apiClient.get(`/api/v1/master/production-status-plans/${id}`);
    const data = response.data;
    return Array.isArray(data) ? data[0] : (data?.data || data);
}

export const createProductionStatusPlan = async (data: any): Promise<ProductionStatusPlan> => {
    const response = await apiClient.post('/api/v1/master/production-status-plans', data);
    return response.data?.data;
}

export const updateProductionStatusPlan = async (id: number | string, data: any): Promise<ProductionStatusPlan> => {
    const response = await apiClient.put(`/api/v1/master/production-status-plans/${id}`, data);
    return response.data?.data;
}

export const deleteProductionStatusPlan = async (id: number | string): Promise<void> => {
    await apiClient.delete(`/api/v1/master/production-status-plans/${id}`);
}
