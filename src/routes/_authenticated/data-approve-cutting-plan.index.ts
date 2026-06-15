import { createFileRoute } from '@tanstack/vue-router'
import DataApproveCuttingPlanPage from '@/pages/data-approve-cutting-plan/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/data-approve-cutting-plan/')({
    beforeLoad: () => {
        requirePermission('DATA_APPROVE_CUTTING_PLAN_READ')()
    },
    component: DataApproveCuttingPlanPage,
    staticData: {
        breadcrumb: 'Data Approve Cutting Plan'
    }
})
