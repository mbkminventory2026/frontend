import { apiClient } from "@/lib/apiClient";

export interface DataApproveCuttingPlanRow {
  size: string;
  qty_order: number;
  qty_cutting_plan: number;
  qty_cutting_actual: number;
  cutting_report: number;
  balance_allowance: number;
}

export interface DataApproveCuttingPlanDetail {
  id_dacp: number;
  no_dokumen: string;
  tanggal: string;
  id_wo: number;
  buyer: string;
  model: string;
  style: string;
  created_at: string;
  rows: DataApproveCuttingPlanRow[];
}

export interface DataApproveCuttingPlanListItem {
  id_dacp: number;
  no_dokumen: string;
  tanggal: string;
  id_wo: number;
  buyer: string;
  model: string;
  created_at: string;
}

export const createDataApproveCuttingPlan = async (payload: {
  no_dokumen: string;
  tanggal: string;
  id_wo: number;
}): Promise<DataApproveCuttingPlanDetail> => {
  const res = await apiClient.post<DataApproveCuttingPlanDetail>(
    "/api/v1/data-approve-cutting-plans",
    payload
  );
  return res.data;
};

export const getDataApproveCuttingPlanById = async (
  id: string | number
): Promise<DataApproveCuttingPlanDetail> => {
  if (!id) throw new Error("ID is required");
  const res = await apiClient.get<DataApproveCuttingPlanDetail>(
    `/api/v1/data-approve-cutting-plans/${id}`
  );
  return res.data;
};

export const getDataApproveCuttingPlans = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ results: DataApproveCuttingPlanListItem[]; count: number }> => {
  const res = await apiClient.get<{
    items: DataApproveCuttingPlanListItem[];
    pagination: { total_items: number };
  }>("/api/v1/data-approve-cutting-plans", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
    },
  });
  return {
    results: res.data.items || [],
    count:
      res.data.pagination?.total_items || res.data.items?.length || 0,
  };
};
