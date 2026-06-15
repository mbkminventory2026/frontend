import { createFileRoute } from '@tanstack/vue-router'
import DataApproveCuttingPlanDetailPage from '@/pages/data-approve-cutting-plan/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/data-approve-cutting-plan/$id')({
    beforeLoad: () => {
        requirePermission('DATA_APPROVE_CUTTING_PLAN_READ')()
    },
    component: DataApproveCuttingPlanDetailPage,
    staticData: {
        breadcrumb: 'Detail Data Approve Cutting Plan'
    }
})
