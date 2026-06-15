import { createTableParamsSchema } from '@/schemas/table-params';

export const sizeColumns: [string, ...string[]] = [
    'created_at',
    'id_size',
    'nama_size',
]

export const sizeSchema = createTableParamsSchema(sizeColumns)
