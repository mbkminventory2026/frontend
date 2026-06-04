import { createFileRoute } from '@tanstack/vue-router'
import WorkOrderCreatePage from '@/pages/work-order/create/page.vue'

export const Route = createFileRoute('/_authenticated/work-order/create')({
    component: WorkOrderCreatePage,
    staticData: {
        breadcrumb: 'Tambah Work Order'
    }
})
