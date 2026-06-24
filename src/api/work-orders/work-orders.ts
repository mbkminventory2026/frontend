import { apiClient } from "@/lib/apiClient";
import { mapPayloadToSnakeCase } from "@/lib/utils";

export interface WorkOrderListItem {
  id_wo: number;
  buyer: string;
  model: string;
  qty: number;
  fob_cmt: boolean;
  delivery: string;
  id_po_client_item: number;
  status: string;
  closed_at?: string;
  po_number: string;
  po_client_item_style: string;
  created_at: string;
  has_retur: boolean;
  id_po_client: number;
  retur_file?: string;
}

export interface WorkOrderShellSize {
  id_wo_shell_size: number;
  id_size?: number | null;
  size: string;
  qty: number;
  ratio: number;
  created_at: string;
}

export interface WorkOrderShell {
  id_wo_shell: number;
  deskripsi: string;
  cons: number;
  color: string;
  allow: number;
  berat_1_yd: number;
  created_at: string;
  provided_by: string;
  material_type: string;
  sizes: WorkOrderShellSize[];
}

export interface WorkOrderTrim {
  id_wo_trim: number;
  item: string;
  description: string;
  color: string;
  code: string;
  cons: number;
  qty: number;
  uom: string;
  position: string;
  created_by: string;
  allow: number;
  created_at: string;
  provided_by: string;
}

export interface MaterialListItem {
  id_material_list_item: number;
  id_material_list: number;
  item: string;
  description: string;
  qty: number;
  unit: string;
  est_price: number;
  id_wo_shell?: number;
  id_wo_trim?: number;
  created_at: string;
  qty_surat_jalan: number;
  qty_received: number;
}

export interface MaterialList {
  id_material_list: number;
  id_wo: number;
  name: string;
  is_locked: boolean;
  created_at: string;
  items: MaterialListItem[];
}

export interface ReturClientResponse {
  id_retur_client: number;
  id_wo: number;
  file: string;
  deskripsi: string;
  created_at: string;
}

export interface WorkOrderDetailResponse {
  id_wo: number;
  buyer: string;
  model: string;
  qty: number;
  fob_cmt: boolean;
  delivery: string;
  id_po_client_item: number;
  status: string;
  closed_by_user_id?: number;
  closed_at?: string;
  po_number: string;
  po_client_item_style: string;
  created_at: string;
  shells: WorkOrderShell[];
  trims: WorkOrderTrim[];
  material_lists: MaterialList[];
  retur?: ReturClientResponse;
}

export const getWorkOrders = async (params: {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}) => {
  const response = await apiClient.get<{
    items: WorkOrderListItem[];
    pagination: { total_items: number };
  }>("/api/v1/work-orders", {
    params: {
      page: params.page ?? (params.offset ?? 0) / (params.limit ?? 20) + 1,
      pageSize: params.pageSize ?? params.limit,
      limit: params.limit,
      search: params.search,
      sortBy: params.sortBy,
      sortDesc: params.sortDesc,
    },
  });

  return {
    results: response.data.items || [],
    count:
      response.data.pagination?.total_items || response.data.items?.length || 0,
  };
};

export const createWorkOrder = async (data: any) => {
  // If delivery date contains ISO timestamp, clean it to YYYY-MM-DD
  if (data.delivery && data.delivery.includes("T")) {
    data.delivery = data.delivery.split("T")[0];
  }
  const snakeCaseValue = mapPayloadToSnakeCase(data);
  return await apiClient.post("/api/v1/work-orders", snakeCaseValue);
};

export const getWorkOrderById = async (id: string | number) => {
  if (!id) throw new Error("ID is required");
  const response = await apiClient.get<{ data: WorkOrderDetailResponse }>(
    `/api/v1/work-orders/${id}`,
  );
  return (response.data as any).data || response.data;
};

export const updateWorkOrder = async (id: string | number, data: any) => {
  if (!id) throw new Error("ID is required");
  // If delivery date contains ISO timestamp, clean it to YYYY-MM-DD
  if (data.delivery && data.delivery.includes("T")) {
    data.delivery = data.delivery.split("T")[0];
  }
  const snakeCaseValue = mapPayloadToSnakeCase(data);
  return await apiClient.put(`/api/v1/work-orders/${id}`, snakeCaseValue);
};

export const closeWorkOrder = async (id: string | number) => {
  if (!id) throw new Error("ID is required");
  return await apiClient.patch(`/api/v1/work-orders/${id}/close`);
};

export const submitWorkOrderReturn = async (id: string | number, formData: FormData) => {
  if (!id) throw new Error("ID is required");
  return await apiClient.post(`/api/v1/work-orders/${id}/retur`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const clientCloseWorkOrder = async (id: string | number) => {
  if (!id) throw new Error("ID is required");
  return await apiClient.patch(`/api/v1/work-orders/${id}/client-close`);
};

export const downloadWorkOrderExcel = async (id: string | number) => {
  if (!id) throw new Error("ID is required");

  const response = await apiClient.get(`/api/v1/work-orders/${id}/export/excel`, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  const matchedFileName = contentDisposition?.match(/filename="([^"]+)"/i);
  const fileName = matchedFileName?.[1] || `work-order-${id}.xlsx`;

  return {
    blob: response.data as Blob,
    fileName,
  };
};

export interface ReturClientListItem {
  id_retur_client: number;
  id_wo: number;
  file: string;
  deskripsi: string;
  created_at: string;
  buyer: string;
  model: string;
  wo_qty: number;
  po_number: string;
  id_mitra: number;
  mitra_name: string;
  id_po_client: number;
}

export const getWorkOrderReturns = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) => {
  const response = await apiClient.get<{
    items: ReturClientListItem[];
    pagination: { total_items: number };
  }>("/api/v1/work-orders/returns", {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
    },
  });

  return {
    results: response.data.items || [],
    count:
      response.data.pagination?.total_items || response.data.items?.length || 0,
  };
};

export interface DailyReportListItem {
  division: string;
  tanggal: string;
  qty: number;
  id_wo_shell_size: number;
}

export const getWorkOrderDailyReports = async (id: string | number) => {
  if (!id) throw new Error("ID is required");
  const response = await apiClient.get<{ items: DailyReportListItem[] }>(
    `/api/v1/work-orders/${id}/daily-reports`
  );
  return response.data;
};
