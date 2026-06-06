import { createTableParamsSchema } from '@/schemas/table-params';

export const poInternalColumns: [string, ...string[]] = [
    'created_at',
    'id_po_internal',
    'nama_po',
    'tanggal',
    'supplier_name',
    'currency',
    'ship_date',
]


export const poInternalSchema = createTableParamsSchema(poInternalColumns)
