import { createFileRoute } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'
import RekonsiliasiDetailPage from '@/pages/rekonsiliasi/detail/page.vue'

export const Route = createFileRoute('/_authenticated/rekonsiliasi/$id')({
  beforeLoad: () => {
    requirePermission('REKONSILIASI_READ')()
  },
  component: RekonsiliasiDetailPage,
  staticData: {
    breadcrumb: 'Detail Rekonsiliasi',
  },
})
