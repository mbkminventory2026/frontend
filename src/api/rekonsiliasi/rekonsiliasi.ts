import { apiClient } from '@/lib/apiClient'

export interface RekonsiliasiListItem {
  id_rekonsiliasi: number
  id_wo: number
  nama_wo: string
  buyer: string
  brand: string
  style: string
  qty_po: number
  plan_cut_total: number
  created_at: string
  updated_at: string
  created_by_username: string
  updated_by_username: string
}

export interface RekonsiliasiColorSizeSummary {
  size: string
  qty_order: number
  qty_kirim: number
  balance: number
}

export interface RekonsiliasiColorSummary {
  color: string
  qty_order: number
  qty_kirim: number
  balance: number
  size_breakdown: RekonsiliasiColorSizeSummary[]
}

export interface RekonsiliasiTerimaEntry {
  id_rekonsiliasi_terima_entry: number
  entry_type: 'awal' | 'untuk' | 'ambil'
  entry_label: string
  qty: number
  note: string
  created_at: string
  updated_at: string
}

export interface RekonsiliasiMaterialRow {
  id_rekonsiliasi_material_row: number
  row_no: number
  kategori: string
  description: string
  size_label: string
  ratio_source: number
  ratio_input: number
  qty_per_pcs_input: number
  qty_wo: number
  toleransi: number
  satuan: string
  qty_actual_kirim_source: number
  qty_actual_kirim_manual: number
  qty_actual_kirim: number
  total_terima: number
  cons_actual: number
  balance: number
  reject_qty: number
  retur_qty: number
  last_balance: number
  keterangan: string
  id_material_list_item?: number
  id_wo_shell?: number
  id_wo_trim?: number
  terima_entries: RekonsiliasiTerimaEntry[] | null
}

export interface RekonsiliasiHeader {
  id_rekonsiliasi: number
  id_wo: number
  jasa: string
  no_po: string
  delivery: string
  buyer: string
  brand: string
  style: string
  qty_po: number
  plan_cut_total: number
  cons_baju_summary: string
  nama_bahan: string
  warna_kain_summary: string[]
  created_at: string
  updated_at: string
  created_by_username: string
  updated_by_username: string
}

export interface RekonsiliasiDetailResponse {
  header: RekonsiliasiHeader
  color_summaries: RekonsiliasiColorSummary[]
  material_rows: RekonsiliasiMaterialRow[]
}

export interface UpdateRekonsiliasiTerimaEntryPayload {
  id_rekonsiliasi_terima_entry?: number
  entry_type: 'awal' | 'untuk' | 'ambil'
  entry_label: string
  qty: number
  note: string
}

export interface UpdateRekonsiliasiMaterialRowPayload {
  id_rekonsiliasi_material_row: number
  ratio_input: number
  qty_per_pcs_input: number
  qty_actual_kirim_manual: number
  reject_qty: number
  retur_qty: number
  keterangan: string
  terima_entries: UpdateRekonsiliasiTerimaEntryPayload[]
}

export interface UpdateRekonsiliasiPayload {
  material_rows: UpdateRekonsiliasiMaterialRowPayload[]
}

export const getRekonsiliasis = async (params: {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDesc?: boolean
  idWo?: number
}) => {
  const response = await apiClient.get<{
    items: RekonsiliasiListItem[]
    pagination: { total_items: number }
  }>('/api/v1/rekonsiliasi', {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      q: params.search,
      filter: params.search,
      sortBy: params.sortBy,
      sortDesc: params.sortDesc,
      idWo: params.idWo,
    },
  })

  return {
    results: response.data.items || [],
    count: response.data.pagination?.total_items || response.data.items?.length || 0,
  }
}

export const createRekonsiliasi = async (idWo: number) => {
  const response = await apiClient.post<RekonsiliasiDetailResponse>('/api/v1/rekonsiliasi', {
    id_wo: idWo,
  })
  return response.data
}

export const getRekonsiliasiById = async (id: string | number) => {
  const response = await apiClient.get<RekonsiliasiDetailResponse>(`/api/v1/rekonsiliasi/${id}`)
  return response.data
}

export const updateRekonsiliasi = async (id: string | number, payload: UpdateRekonsiliasiPayload) => {
  const response = await apiClient.put<RekonsiliasiDetailResponse>(`/api/v1/rekonsiliasi/${id}`, payload)
  return response.data
}

export const refreshRekonsiliasi = async (id: string | number) => {
  const response = await apiClient.post<RekonsiliasiDetailResponse>(`/api/v1/rekonsiliasi/${id}/refresh`)
  return response.data
}
