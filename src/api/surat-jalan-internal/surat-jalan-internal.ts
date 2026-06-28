import { apiClient } from "@/lib/apiClient";
import type { CreateSuratJalanInternalRequest, AssignPackingListRequest } from "@/schemas/surat-jalan-internal/request";
import type {
  SuratJalanInternalListItem,
  SuratJalanInternalDetailResponse,
  SuratJalanInternalCreateResponse,
} from "@/schemas/surat-jalan-internal/response";

export const createSuratJalanInternal = async (
  data: CreateSuratJalanInternalRequest
) => {
  const response = await apiClient.post<{ data: SuratJalanInternalCreateResponse }>(
    "/api/v1/surat-jalan-internals",
    data
  );
  return response.data.data || response.data;
};

export const getSuratJalanInternalById = async (id: string | number) => {
  if (!id) throw new Error("ID is required");
  const response = await apiClient.get<{ data: SuratJalanInternalDetailResponse }>(
    `/api/v1/surat-jalan-internals/${id}`
  );
  return response.data.data || response.data;
};

export const getSuratJalanInternals = async (params: {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}) => {
  const response = await apiClient.get<{
    items: SuratJalanInternalListItem[];
    pagination: { total_items: number };
  }>("/api/v1/surat-jalan-internals", {
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

export const downloadSuratJalanInternalExcel = async (id: string | number) => {
  if (!id) throw new Error("ID is required");

  const response = await apiClient.get(
    `/api/v1/surat-jalan-internals/${id}/export/excel`,
    {
      responseType: "blob",
    }
  );

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  const matchedFileName = contentDisposition?.match(/filename="([^"]+)"/i);
  const fileName = matchedFileName?.[1] || `surat-jalan-internal-${id}.xlsx`;

  return {
    blob: response.data as Blob,
    fileName,
  };
};

export const assignPackingListToSJ = async (
  idSJ: number,
  req: AssignPackingListRequest
) => {
  const response = await apiClient.post(
    `/api/v1/surat-jalan-internals/${idSJ}/assign`,
    req
  );
  return response.data;
};

export const unassignPackingListFromSJ = async (
  idSJ: number,
  idPL: number
) => {
  const response = await apiClient.delete(
    `/api/v1/surat-jalan-internals/${idSJ}/assign/${idPL}`
  );
  return response.data;
};
