import { createFileRoute } from '@tanstack/vue-router'
import MasterPlanDetailPage from '@/pages/master-plan/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/master-plan/$id')({
    beforeLoad: () => {
        requirePermission('MASTER_PLAN_READ')()
    },
    component: MasterPlanDetailPage,
    staticData: {
        breadcrumb: 'Detail Master Plan'
    }
})
