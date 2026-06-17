import { apiClient } from '@/lib/apiClient';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MasterPlanListItem {
  id_master_plan: number;
  id_departemen: number;
  nama_departemen: string;
  id_production_line: number;
  nama_line: string;
  nama: string;
  created_at: string;
}

export interface TargetHarianItem {
  tanggal: string;
  target: number;
}

export interface OutputHarianItem {
  tanggal: string;
  output: number;
}

export interface TargetProsesItem {
  tanggal: string;
  nama_proses: string;
}

export interface MasterPlanItemDetail {
  id_master_plan_item: number;
  id_master_plan: number;
  id_wo_shell: number;
  id_wo: number;
  no_urut: number;
  buyer: string;
  style: string;
  qty: number;
  color: string;
  deskripsi: string;
  created_at: string;
  target_harian: TargetHarianItem[];
  output_harian: OutputHarianItem[];
  target_proses: TargetProsesItem[];
}

export interface MasterPlanDetail {
  id_master_plan: number;
  id_departemen: number;
  nama_departemen: string;
  id_production_line: number;
  nama_line: string;
  nama: string;
  created_at: string;
  items: MasterPlanItemDetail[];
}

// ─── API Functions ───────────────────────────────────────────────────────────

// Interceptor sudah unwrap response.data.data → response.data berisi payload langsung

export const getMasterPlans = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ results: MasterPlanListItem[]; count: number }> => {
  const response = await apiClient.get<{ items: MasterPlanListItem[]; pagination: { total_items: number } }>(
    '/api/v1/master-plans',
    { params: { page: params?.page, limit: params?.limit ?? 20, search: params?.search } }
  );
  const d = response.data;
  return { results: d?.items ?? [], count: d?.pagination?.total_items ?? d?.items?.length ?? 0 };
};

export const getMasterPlanById = async (id: number | string): Promise<MasterPlanDetail> => {
  const response = await apiClient.get<MasterPlanDetail>(`/api/v1/master-plans/${id}`);
  return response.data;
};

export const createMasterPlan = async (payload: {
  id_departemen: number;
  id_production_line: number;
  nama?: string;
  items?: { id_wo_shell: number; no_urut?: number }[];
}): Promise<MasterPlanDetail> => {
  const response = await apiClient.post<MasterPlanDetail>('/api/v1/master-plans', payload);
  return response.data;
};

export const updateMasterPlan = async (id: number, payload: { nama: string }): Promise<MasterPlanDetail> => {
  const response = await apiClient.put<MasterPlanDetail>(`/api/v1/master-plans/${id}`, payload);
  return response.data;
};

export const deleteMasterPlan = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/master-plans/${id}`);
};

export const addMasterPlanItem = async (
  planId: number,
  payload: { id_wo_shell: number; no_urut?: number }
): Promise<MasterPlanItemDetail> => {
  const response = await apiClient.post<MasterPlanItemDetail>(
    `/api/v1/master-plans/${planId}/items`,
    payload
  );
  return response.data;
};

export const removeMasterPlanItem = async (planId: number, itemId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/master-plans/${planId}/items/${itemId}`);
};

export const upsertTargetHarian = async (
  planId: number,
  itemId: number,
  entries: { tanggal: string; target: number }[]
): Promise<void> => {
  await apiClient.put(`/api/v1/master-plans/${planId}/items/${itemId}/target-harian`, { entries });
};

export const upsertOutputHarian = async (
  planId: number,
  itemId: number,
  entries: { tanggal: string; output: number }[]
): Promise<void> => {
  await apiClient.put(`/api/v1/master-plans/${planId}/items/${itemId}/output-harian`, { entries });
};

export const upsertTargetProses = async (
  planId: number,
  itemId: number,
  payload: { tanggal: string; nama_proses: string }
): Promise<void> => {
  await apiClient.put(`/api/v1/master-plans/${planId}/items/${itemId}/target-proses`, payload);
};

export const deleteTargetProses = async (
  planId: number,
  itemId: number,
  tanggal: string
): Promise<void> => {
  await apiClient.delete(`/api/v1/master-plans/${planId}/items/${itemId}/target-proses/${tanggal}`);
};
