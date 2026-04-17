import z from "zod"

export const tabelParamsSchema = z.object({
  page: z.number().catch(1),    // default 1
  filter: z.string().catch(''), // default ''
  sort: z.enum(['alphabet', 'newest']).catch('newest'),   // default 'newest',
  pageSize: z.union([
    z.literal(20),
    z.literal(50),
    z.literal(100)
  ]).catch(20),
})

export type TableParams = z.infer<typeof tabelParamsSchema>;