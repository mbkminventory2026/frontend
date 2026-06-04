import { createFileRoute } from '@tanstack/vue-router'
import WorkOrderEditPage from '@/pages/work-order/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/work-order/edit/$id')({
    beforeLoad: () => {
        requirePermission('WO_UPDATE')()
    },
    component: WorkOrderEditPage,
    staticData: {
        breadcrumb: 'Edit Work Order'
    }
})
