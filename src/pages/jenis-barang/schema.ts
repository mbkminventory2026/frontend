import { createTableParamsSchema } from '@/schemas/table-params';

export const jenisBarangColumns: [string, ...string[]] = [
    'created_at',
    'id_jenis_barang',
    'kode',
    'nama_jenis_barang'
]


export const jenisBarangSchema = createTableParamsSchema(jenisBarangColumns)
