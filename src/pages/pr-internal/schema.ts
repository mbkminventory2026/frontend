import { createTableParamsSchema } from '@/schemas/table-params';

export const prInternalColumns: [string, ...string[]] = [
    'created_at',
    'id_pr_internal',
    'nama',
    'tanggal',
    'vendor_name',
    'departemen',
    'projek',
    'status',
]

export const prInternalSchema = createTableParamsSchema(prInternalColumns)
