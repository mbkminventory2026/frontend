import { createFileRoute } from '@tanstack/vue-router'
import MaterialListPage from '@/pages/material-list/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/material-list/')({
  beforeLoad: () => {
    requirePermission('WO_READ')()
  },
  component: MaterialListPage,
  staticData: {
    breadcrumb: 'Material List'
  }
})
