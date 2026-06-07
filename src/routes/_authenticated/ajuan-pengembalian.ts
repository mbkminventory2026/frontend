import { createFileRoute } from '@tanstack/vue-router'
import AjuanPengembalianPage from '@/pages/ajuan-pengembalian/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/ajuan-pengembalian')({
  beforeLoad: () => {
    requirePermission('WO_READ')()
  },
  component: AjuanPengembalianPage,
  staticData: {
    breadcrumb: 'Ajuan Pengembalian'
  }
})
