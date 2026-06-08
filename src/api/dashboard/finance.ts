import { apiClient } from '@/lib/apiClient';

export interface RecentPOClient {
  id_po_client: number;
  po_number: string;
  tanggal: string;
  mitra_name: string;
}

export interface RecentPOInternal {
  id_po_internal: number;
  nama_po: string;
  tanggal: string;
  supplier_name: string;
}

export interface FinanceDashboardMetrics {
  total_po_client_this_month: number;
  total_po_internal_this_month: number;
  total_pr_internal_this_month: number;
  recent_po_clients: RecentPOClient[];
  recent_po_internals: RecentPOInternal[];
}

export const getFinanceMetrics = async (): Promise<FinanceDashboardMetrics> => {
  const response = await apiClient.get('/api/v1/dashboard/finance');
  return response.data.data;
};

export interface PendingApproval {
  document_id: number;
  table_name: string;
  current_status: string;
}

export const getPendingApprovals = async (): Promise<PendingApproval[]> => {
  const response = await apiClient.get('/api/v1/approvals/pending');
  return response.data.data;
};
