import { createTableParamsSchema } from '@/schemas/table-params';

export const barangColumns: [string, ...string[]] = [
    'created_at',
    'id_barang',
    'kode',
    'nama_barang',
    'nama_jenis_barang',
    'nama_perusahaan'
]


export const barangSchema = createTableParamsSchema(barangColumns)
