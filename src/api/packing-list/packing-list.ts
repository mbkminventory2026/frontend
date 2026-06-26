import { apiClient } from "@/lib/apiClient";
import type { CreatePackingListRequest } from "@/schemas/packing-list/request";
import type { PackingListResponse, PackingListListItem } from "@/schemas/packing-list/response";

export const createPackingList = async (data: CreatePackingListRequest) => {
  const response = await apiClient.post<{ data: PackingListResponse }>('/api/v1/packing-lists', data);
  return response.data.data || response.data;
};

export const getPackingListById = async (id: string | number) => {
  if (!id) throw new Error("ID is required");
  const response = await apiClient.get<{ data: PackingListResponse }>(`/api/v1/packing-lists/${id}`);
  return response.data.data || response.data;
};

export const downloadPackingListExcel = async (id: string | number) => {
  if (!id) throw new Error("ID is required");

  const response = await apiClient.get(`/api/v1/packing-lists/${id}/export/excel`, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  const matchedFileName = contentDisposition?.match(/filename="([^"]+)"/i);
  const fileName = matchedFileName?.[1] || `packing-list-${id}.xlsx`;

  return {
    blob: response.data as Blob,
    fileName,
  };
};

export const getPackingLists = async (params: {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}) => {
  const response = await apiClient.get<{
    items: PackingListListItem[];
    pagination: { total_items: number };
  }>("/api/v1/packing-lists", {
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
    count: response.data.pagination?.total_items || response.data.items?.length || 0,
  };
};
