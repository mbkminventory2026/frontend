import { createFileRoute } from '@tanstack/vue-router'
import WorkOrderCreatePage from '@/pages/work-order/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/work-order/create')({
    beforeLoad: () => {
        requirePermission('WO_CREATE')()
    },
    component: WorkOrderCreatePage,
    staticData: {
        breadcrumb: 'Tambah Work Order'
    }
})
