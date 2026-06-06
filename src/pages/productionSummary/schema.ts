import { createTableParamsSchema } from '@/schemas/table-params';

export const productionColumns: [string, ...string[]] = [
  'model_name',
  'size',
  'target_qty',
  'cutting',
  'sewing',
  'qc_pass',
  'packing',
  'shipped',
  'last_updated'
]


export const productionSearchSchema = createTableParamsSchema(productionColumns)
