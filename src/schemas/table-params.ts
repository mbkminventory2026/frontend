import z from "zod"

export const tableParamKeys = ['page', 'filter', 'sortBy', 'sortDesc', 'pageSize'] as const;

export const createTableParamsSchema = <T extends [string, ...string[]]>(validColumns: T) => {
  return z.object({
    page: z.coerce.number().catch(1),    // default 1
    filter: z.string().catch(''), // default ''

    sortBy: z.enum(validColumns).optional().catch(undefined),

    sortDesc: z.preprocess((val) => val === 'true' || val === true, z.boolean()).catch(false),

    pageSize: z.coerce.number().refine(n => [20, 50, 100].includes(n)).catch(20),
  })
}

export type TableParams<T extends [string, ...string[]] = [string, ...string[]]> = z.infer<
  ReturnType<typeof createTableParamsSchema<T>>
>;