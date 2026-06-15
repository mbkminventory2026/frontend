import { createFileRoute } from '@tanstack/vue-router'
import DataApproveCuttingPlanCreatePage from '@/pages/data-approve-cutting-plan/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/data-approve-cutting-plan/create')({
    beforeLoad: () => {
        requirePermission('DATA_APPROVE_CUTTING_PLAN_CREATE')()
    },
    component: DataApproveCuttingPlanCreatePage,
    staticData: {
        breadcrumb: 'Buat Data Approve Cutting Plan'
    }
})
