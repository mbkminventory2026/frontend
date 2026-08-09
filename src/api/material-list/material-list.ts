import { apiClient } from "@/lib/apiClient";

export interface MaterialListPageItem {
  id_material_list: number;
  id_wo: number;
  name: string;
  is_locked: boolean;
  created_at: string;
  buyer: string;
  model: string;
  wo_qty: number;
  item_count: number;
  total_qty_sj: number;
  total_qty_received: number;
}

export interface MaterialListPageResponse {
  items: MaterialListPageItem[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

export const getMaterialLists = async (params: {
  limit: number;
  offset: number;
  search?: string;
  locked_only?: boolean;
}) => {
  const response = await apiClient.get<MaterialListPageResponse>("/api/v1/material-lists", {
    params: {
      limit: params.limit,
      offset: params.offset,
      q: params.search,
      locked_only: params.locked_only !== false ? "true" : "false",
    },
  });
  const data = response.data as MaterialListPageResponse;
  return {
    results: data.items ?? [],
    count: data.pagination?.total_items ?? 0,
  };
};

export const getMaterialListItems = async (id: number) => {
  const response = await apiClient.get(`/api/v1/material-lists/${id}`);
  return response.data;
};

export interface CreateSuratJalanClientPayload {
  tanggal: string;
  qty: number;
  keterangan?: string;
  id_material_list_item: number;
}

export interface CreateReceivedPayload {
  tanggal: string;
  qty: number;
  keterangan?: string;
  id_material_list_item: number;
}

export const createSuratJalanClient = async (payload: CreateSuratJalanClientPayload) => {
  return await apiClient.post("/api/v1/surat-jalan/client", payload);
};

export const createReceived = async (payload: CreateReceivedPayload) => {
  return await apiClient.post("/api/v1/received", payload);
};

export interface CreateMaterialListItemPayload {
  item: string;
  description?: string;
  qty: number;
  unit: string;
  est_price?: number;
  id_wo_shell?: number | null;
  id_wo_trim?: number | null;
  category: "FABRIC" | "SEWING" | "PACKING";
  cons_per_pc?: number | null;
  qty_wo_scope: "WHOLE_WO" | "SIZE" | "COLOR" | "COLOR_SIZE";
  id_qty_wo_shell: number | null;
  id_qty_wo_size: number | null;
}

export const createMaterialListItem = async (idML: number, payload: CreateMaterialListItemPayload) => {
  const response = await apiClient.post(`/api/v1/material-lists/${idML}/items`, payload);
  return response.data;
};

export interface UpdateMaterialListItemPayload {
  item: string;
  description: string;
  qty: number;
  unit: string;
  est_price: number;
  id_wo_shell?: number | null;
  id_wo_trim?: number | null;
  category?: "FABRIC" | "SEWING" | "PACKING" | null;
  cons_per_pc?: number | null;
  qty_wo_scope?: "WHOLE_WO" | "SIZE" | "COLOR" | "COLOR_SIZE" | null;
  id_qty_wo_shell?: number | null;
  id_qty_wo_size?: number | null;
}

export const updateMaterialListItem = async (id: number, payload: UpdateMaterialListItemPayload) => {
  const response = await apiClient.patch(`/api/v1/material-list-items/${id}`, payload);
  return response.data;
};
