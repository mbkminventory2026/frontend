import { createFileRoute } from '@tanstack/vue-router'
import SpreadingPlanCreatePage from '@/pages/spreading-cutting-plan/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/spreading-cutting-plan/create')({
    beforeLoad: () => {
        requirePermission('CUTTING_PLAN_CREATE')()
    },
    component: SpreadingPlanCreatePage,
    staticData: {
        breadcrumb: 'Tambah Spreading Plan'
    }
})
