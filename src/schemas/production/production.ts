import * as z from 'zod'

// ─── Division Config (Single Source of Truth) ──────────────────────────────
export const VALID_DIVISIONS = ['cutting', 'sewing', 'qc-finish', 'packing', 'pengiriman'] as const
export type DivisionSlug = typeof VALID_DIVISIONS[number]

export interface DivisionMeta {
  slug: DivisionSlug
  label: string
  /** The production stats field from the *previous* stage used to cap max QTY.
   *  'target_qty' means this is the first stage (Cutting), capped by the WO target.
   */
  prevField: 'target_qty' | 'cutting' | 'sewing' | 'qc_pass' | 'packing'
}

export const DIVISION_META: DivisionMeta[] = [
  { slug: 'cutting',    label: 'Cutting',     prevField: 'target_qty' },
  { slug: 'sewing',     label: 'Sewing',      prevField: 'cutting'    },
  { slug: 'qc-finish',  label: 'QC Finish',   prevField: 'sewing'     },
  { slug: 'packing',    label: 'Packing',     prevField: 'qc_pass'    },
  { slug: 'pengiriman', label: 'Pengiriman',  prevField: 'packing'    },
]

// ─── Production Stats ───────────────────────────────────────────────────────
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
