import { createFileRoute } from '@tanstack/vue-router'
import MasterPlanCreatePage from '@/pages/master-plan/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/master-plan/create')({
    beforeLoad: () => {
        requirePermission('MASTER_PLAN_CREATE')()
    },
    component: MasterPlanCreatePage,
    staticData: {
        breadcrumb: 'Buat Master Plan'
    }
})
