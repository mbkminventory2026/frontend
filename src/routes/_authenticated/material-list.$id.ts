import { createFileRoute } from '@tanstack/vue-router'
import MaterialListItemDetailPage from '@/pages/material-list/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/material-list/$id')({
  beforeLoad: () => {
    requirePermission('WO_READ')()
  },
  component: MaterialListItemDetailPage,
  staticData: {
    breadcrumb: 'Detail Material List Item'
  }
})
