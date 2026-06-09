import { createTableParamsSchema } from '@/schemas/table-params';

export const productionLineColumns: [string, ...string[]] = [
    'created_at',
    'id_production_line',
    'name'
]

export const productionLineSchema = createTableParamsSchema(productionLineColumns)
