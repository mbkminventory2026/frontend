import { z } from 'zod';

export const masterPlanSchema = z.object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    filter: z.string().optional(),
});
