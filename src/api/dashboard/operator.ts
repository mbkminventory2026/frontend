import { apiClient } from "@/lib/apiClient";

export interface OngoingWorkOrder {
  id_wo: number;
  buyer: string;
  model: string;
  qty: number;
  total_output: number;
}

export interface OperatorDashboardMetrics {
  active_work_orders: number;
  target_produksi_pcs: number;
  output_hari_ini: number;
  rasio_reject: number;
  ongoing_work_orders: OngoingWorkOrder[];
}

export const getOperatorMetrics = async () => {
  const response = await apiClient.get<OperatorDashboardMetrics>(
    "/api/v1/dashboard/admin-sistem"
  );
  return response.data;
};
