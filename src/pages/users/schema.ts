import { createTableParamsSchema } from '@/schemas/table-params';

export const usersColumns: [string, ...string[]] = [
    'created_at',
    'id_user',
    'username',
    'status',
    'nama_role'
]


export const usersSchema = createTableParamsSchema(usersColumns)
