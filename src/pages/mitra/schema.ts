import { createTableParamsSchema } from '@/schemas/table-params';

export const mitraColumns: [string, ...string[]] = [
    'created_at',
    'id_mitra',
    'nama_perusahaan',
    'email',
    'no_telp',
    'tipe_perusahaan'
]


export const mitraSchema = createTableParamsSchema(mitraColumns)
