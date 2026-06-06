import { createTableParamsSchema } from '@/schemas/table-params';

export const permissionsColumns: [string, ...string[]] = [
    'created_at',
    'id_hak_akses',
    'nama_halaman'
]


export const permissionsSchema = createTableParamsSchema(permissionsColumns)
