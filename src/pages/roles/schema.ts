import { createTableParamsSchema } from '@/schemas/table-params';

export const rolesColumns: [string, ...string[]] = [
    'created_at',
    'id_role',
    'nama_role'
]


export const rolesSchema = createTableParamsSchema(rolesColumns)
