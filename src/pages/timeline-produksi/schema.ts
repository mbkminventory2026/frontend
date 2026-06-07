import { createTableParamsSchema } from '@/schemas/table-params';
import { z } from 'zod';

export const timelineProduksiColumns: [string, ...string[]] = [
    'created_at',
    'id_timeline',
]

export const timelineProduksiSchema = createTableParamsSchema(timelineProduksiColumns)

export const woShellPlanStatusSchema = z.object({
    statusGelarCutting: z.string().optional(),
    statusEmbroo: z.string().optional(),
    statusLoadingSewing: z.string().optional(),
    statusFinishingPacking: z.string().optional(),
})

export const woShellPlanRequestSchema = z.object({
    idWoShell: z.number().min(1, "WO Shell is required"),
    inLine: z.string().min(1, "In Line is required"),
    tglGelarCutting: z.string().optional(),
    statusGelarCutting: z.string().optional(),
    tglEmbroo: z.string().optional(),
    statusEmbroo: z.string().optional(),
    tglLoadingSewing: z.string().optional(),
    statusLoadingSewing: z.string().optional(),
    tglFinishingPacking: z.string().optional(),
    statusFinishingPacking: z.string().optional(),
})

export const createTimelinePlanSchema = z.object({
    idPoClient: z.number().min(1, "PO Client is required"),
    tanggalDisusun: z.string().min(1, "Tanggal Disusun is required"),
    notes: z.string().optional(),
    shellPlans: z.array(woShellPlanRequestSchema).min(1, "Minimal 1 WO Shell Plan dibutuhkan"),
})
