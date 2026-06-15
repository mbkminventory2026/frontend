import { createFileRoute } from '@tanstack/vue-router'
import Page from '@/pages/timeline-produksi/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/timeline-produksi/create')({
  beforeLoad: () => {
    requirePermission('TIMELINE_CREATE')()
  },
  component: Page,
})
