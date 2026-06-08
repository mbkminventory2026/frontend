import { z } from 'zod';

export const spreadingCuttingPlanSchema = z.object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    filter: z.string().optional(),
    sortBy: z.string().optional(),
    sortDesc: z.boolean().optional(),
});
