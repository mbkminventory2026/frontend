import { createFileRoute } from '@tanstack/vue-router'
import WorkOrderEditPage from '@/pages/work-order/edit/page.vue'

export const Route = createFileRoute('/_authenticated/work-order/edit/$id')({
    component: WorkOrderEditPage,
    staticData: {
        breadcrumb: 'Edit Work Order'
    }
})
