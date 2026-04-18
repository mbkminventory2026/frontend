import z from "zod"

export const createTableParamsSchema = <T extends [string, ...string[]]>(validColumns: T) => {
  return z.object({
    page: z.coerce.number().catch(1),    // default 1
    filter: z.string().catch(''), // default ''
    sortBy: z.enum(validColumns).optional(),
    sortDesc: z.boolean().catch(false),
    
    pageSize: z.enum(['20', '50', '100']).transform(Number).catch(20),
  })
}

export type TableParams<T extends [string, ...string[]] = [string, ...string[]]> = z.infer<
  ReturnType<typeof createTableParamsSchema<T>>
  >