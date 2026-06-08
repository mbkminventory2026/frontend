import { createFileRoute } from '@tanstack/vue-router'
import SpreadingPlanDetailPage from '@/pages/spreading-cutting-plan/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/spreading-cutting-plan/$id')({
    beforeLoad: () => {
        requirePermission('CUTTING_PLAN_READ')()
    },
    component: SpreadingPlanDetailPage,
    staticData: {
        breadcrumb: 'Detail Spreading Plan'
    }
})
