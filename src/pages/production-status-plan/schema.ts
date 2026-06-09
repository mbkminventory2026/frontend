import { createTableParamsSchema } from '@/schemas/table-params';

export const productionStatusPlanColumns: [string, ...string[]] = [
    'created_at',
    'id_production_status_plan',
    'name'
]

export const productionStatusPlanSchema = createTableParamsSchema(productionStatusPlanColumns)
