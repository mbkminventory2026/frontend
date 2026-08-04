import { z } from 'zod'

export const backupIdSchema = z.string().regex(/^permatatex-backup-\d{8}T\d{6}Z$/)

export const backupSummarySchema = z.object({
  backup_id: backupIdSchema,
  completed_at: z.string(),
  encrypted_size_bytes: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  download_available: z.boolean(),
})

export const backupLastResultSchema = z.object({
  backup_id: backupIdSchema,
  state: z.string(),
  finished_at: z.string(),
  encrypted_size_bytes: z.number().int().nonnegative().optional(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
})

export const backupStatusSchema = z.object({
  state: z.string(),
  backup_id: backupIdSchema.optional(),
  started_at: z.string().optional(),
  last_result: backupLastResultSchema.optional(),
  latest_completed_backup: backupSummarySchema.optional(),
})

export const backupStartSchema = z.object({
  backup_id: backupIdSchema,
  state: z.string(),
})

export const backupListSchema = z.object({
  items: z.array(backupSummarySchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total_items: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
})

export type BackupSummary = z.infer<typeof backupSummarySchema>
export type BackupStatus = z.infer<typeof backupStatusSchema>
export type BackupList = z.infer<typeof backupListSchema>
