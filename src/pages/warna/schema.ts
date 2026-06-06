import { createTableParamsSchema } from '@/schemas/table-params';

export const warnaColumns: [string, ...string[]] = [
    'created_at',
    'id_warna',
    'nama_warna',
    'kode_hex'
]


export const warnaSchema = createTableParamsSchema(warnaColumns)
