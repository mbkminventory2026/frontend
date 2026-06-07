import { createFileRoute } from '@tanstack/vue-router'
import MarkerPlanDetailPage from '@/pages/marker-plan/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/marker-plan/$id')({
    beforeLoad: () => {
        requirePermission('MARKER_PLAN_READ')()
    },
    component: MarkerPlanDetailPage,
    staticData: {
        breadcrumb: 'Detail Marker Plan'
    }
})
