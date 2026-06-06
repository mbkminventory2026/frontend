import { createTableParamsSchema } from '@/schemas/table-params';

export const poClientColumns: [string, ...string[]] = [
    'created_at',
    'id_po_client',
    'po_number',
    'tanggal',
    'season',
    'delivery',
    'mitra_name'
]


export const poClientSchema = createTableParamsSchema(poClientColumns)
