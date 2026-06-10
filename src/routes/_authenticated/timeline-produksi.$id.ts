import { createFileRoute } from '@tanstack/vue-router'
import Page from '@/pages/timeline-produksi/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/timeline-produksi/$id')({
  beforeLoad: () => {
    requirePermission('TIMELINE_READ')()
  },
  component: Page,
})
