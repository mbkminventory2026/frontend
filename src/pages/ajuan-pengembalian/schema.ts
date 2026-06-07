import { createTableParamsSchema } from '@/schemas/table-params';

export const returClientColumns: [string, ...string[]] = [
    'created_at',
    'id_retur_client',
    'po_number',
    'mitra_name',
    'buyer',
    'model'
]

export const returClientSchema = createTableParamsSchema(returClientColumns)
