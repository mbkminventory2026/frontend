import { createTableParamsSchema } from '@/schemas/table-params'

export const historyLogColumns: [string, ...string[]] = [
  'created_at',
  'actor_username',
  'action',
  'module',
  'entity_type',
]

export const historyLogSchema = createTableParamsSchema(historyLogColumns)
