import * as z from 'zod'

export interface ProductionStats {
  cutting: number
  sewing: number
  qc_pass: number
  packing: number
  shipped: number
}

export interface ProductionAggregateResponse {
  id_wo_shell_size: number
  model_name: string
  size: string
  target_qty: number
  production: ProductionStats
  last_updated: string
  status: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ProductionSummaryListResponse {
  items: ProductionAggregateResponse[]
  pagination: PaginationMeta
}

export const operatorReportSchema = z.object({
  id_wo_shell_size: z.coerce.number({
    required_error: 'Model & Size wajib dipilih',
    invalid_type_error: 'Model & Size harus berupa angka',
  }).min(1, 'Model & Size wajib dipilih'),
  
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  
  qty: z.coerce.number({
    required_error: 'Qty wajib diisi',
    invalid_type_error: 'Qty harus berupa angka',
  }).min(1, 'Jumlah qty minimal 1'),
  
  division: z.string().min(1, 'Divisi wajib dipilih'),
})

export type OperatorReportInput = z.infer<typeof operatorReportSchema>

export interface WorkOrderOption {
  id_wo: number
  buyer: string
  model: string
  qty: number
  status: string
  po_number: string
}
