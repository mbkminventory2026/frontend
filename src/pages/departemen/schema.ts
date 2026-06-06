import { createTableParamsSchema } from '@/schemas/table-params';

export const departemenColumns: [string, ...string[]] = [
    'created_at',
    'id_departemen',
    'nama_departemen'
]


export const departemenSchema = createTableParamsSchema(departemenColumns)
