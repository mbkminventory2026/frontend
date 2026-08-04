import { z } from 'zod'

export const systemBackupsSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().refine((value) => [20, 50, 100].includes(value)).catch(20),
})

export function stripSystemBackupsDefaults(search: { page: number; pageSize: number }) {
  return {
    ...(search.page !== 1 ? { page: search.page } : {}),
    ...(search.pageSize !== 20 ? { pageSize: search.pageSize } : {}),
  }
}
