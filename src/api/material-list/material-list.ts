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
