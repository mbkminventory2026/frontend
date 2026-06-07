import { apiClient } from "@/lib/apiClient";

export interface ApprovalPendingItem {
  id_otoritas_detail: number;
  id_otoritas: number;
  nama_tabel_dokumen: string;
  id_dokumen: number;
  tipe_peran: string;
  doc_summary?: string;
  requested_by?: string;
  requested_at: string;
}

export interface AuditTrailStep {
  id_otoritas_detail: number;
  id_user: number;
  nama_user: string;
  tipe_peran: string;
  done: boolean;
  waktu_aksi?: string;
  catatan?: string;
}

export interface DocumentAuditTrail {
  id_otoritas: number;
  nama_tabel: string;
  id_dokumen: number;
  status_global: string;
  steps: AuditTrailStep[];
}

export interface ApprovalActionPayload {
  id_otoritas_detail: number;
  action: "approve" | "reject";
  catatan: string;
}

export interface ApprovalHistoryItem {
  id_otoritas: number;
  nama_tabel_dokumen: string;
  id_dokumen: number;
  status_global: string;
  doc_summary?: string;
  requested_by?: string;
  created_at: string;
}

export interface ApprovalHistoryResponse {
  items: ApprovalHistoryItem[];
  total_items: number;
}

export const getPendingApprovals = async () => {
  const response = await apiClient.get<ApprovalPendingItem[]>("/api/v1/approvals/pending");
  return response.data || [];
};

export const submitApprovalAction = async (payload: ApprovalActionPayload) => {
  const response = await apiClient.post<any>("/api/v1/approvals/action", payload);
  return response.data;
};

export const getDocumentAuditTrail = async (table: string, id: number | string) => {
  const response = await apiClient.get<DocumentAuditTrail>(`/api/v1/approvals/document/${table}/${id}`);
  return response.data;
};

export const getApprovalHistory = async (params: {
  status?: string;
  table?: string;
  limit: number;
  offset: number;
}) => {
  const response = await apiClient.get<ApprovalHistoryResponse>("/api/v1/approvals/history", {
    params: {
      status: params.status || '',
      table: params.table || '',
      limit: params.limit,
      page: Math.floor(params.offset / params.limit) + 1,
    }
  });
  return response.data || { items: [], total_items: 0 };
};
