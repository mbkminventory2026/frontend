import { createTableParamsSchema } from '@/schemas/table-params'

export const rekonsiliasiColumns: [string, ...string[]] = [
  'updated_at',
  'created_at',
  'id_rekonsiliasi',
  'id_wo',
  'buyer',
  'style',
]

export const rekonsiliasiSchema = createTableParamsSchema(rekonsiliasiColumns)

export const rekonsiliasiSearchKeys = [
  'page',
  'filter',
  'sortBy',
  'sortDesc',
  'pageSize',
] as const

export function stripRekonsiliasiDefaults(parsed: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {}

  if (parsed.page !== undefined && parsed.page !== 1) cleaned.page = parsed.page
  if (parsed.filter !== undefined && parsed.filter !== '') cleaned.filter = parsed.filter
  if (parsed.sortBy !== undefined) cleaned.sortBy = parsed.sortBy
  if (parsed.sortDesc === true) cleaned.sortDesc = parsed.sortDesc
  if (parsed.pageSize !== undefined && parsed.pageSize !== 20) cleaned.pageSize = parsed.pageSize

  return cleaned
}
