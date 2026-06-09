import { createTableParamsSchema } from '@/schemas/table-params'
import z from 'zod'

export const historyLogColumns: [string, ...string[]] = [
  'created_at',
  'actor_username',
  'action',
  'module',
  'entity_type',
]

export const historyLogSchema = createTableParamsSchema(historyLogColumns).extend({
  action: z.string().optional().catch(undefined),
  module: z.string().optional().catch(undefined),
  entityType: z.string().optional().catch(undefined),
  dateFrom: z.string().optional().catch(undefined),
  dateTo: z.string().optional().catch(undefined),
})

export const historyLogSearchKeys = [
  'page',
  'filter',
  'sortBy',
  'sortDesc',
  'pageSize',
  'action',
  'module',
  'entityType',
  'dateFrom',
  'dateTo',
] as const

export function stripHistoryLogDefaults(parsed: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {}

  if (parsed.page !== undefined && parsed.page !== 1) cleaned.page = parsed.page
  if (parsed.filter !== undefined && parsed.filter !== '') cleaned.filter = parsed.filter
  if (parsed.sortBy !== undefined) cleaned.sortBy = parsed.sortBy
  if (parsed.sortDesc === true) cleaned.sortDesc = parsed.sortDesc
  if (parsed.pageSize !== undefined && parsed.pageSize !== 20) cleaned.pageSize = parsed.pageSize
  if (parsed.action !== undefined && parsed.action !== 'all') cleaned.action = parsed.action
  if (parsed.module !== undefined && parsed.module !== 'all') cleaned.module = parsed.module
  if (parsed.entityType !== undefined && parsed.entityType !== 'all') cleaned.entityType = parsed.entityType
  if (parsed.dateFrom !== undefined && parsed.dateFrom !== '') cleaned.dateFrom = parsed.dateFrom
  if (parsed.dateTo !== undefined && parsed.dateTo !== '') cleaned.dateTo = parsed.dateTo

  return cleaned
}
