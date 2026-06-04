import { createFileRoute } from '@tanstack/vue-router'
import WorkOrderDetailPage from '@/pages/work-order/detail/page.vue'

export const Route = createFileRoute('/_authenticated/work-order/$id')({
    component: WorkOrderDetailPage,
    staticData: {
        breadcrumb: 'Detail Work Order'
    }
})
