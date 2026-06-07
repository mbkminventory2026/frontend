import { createFileRoute } from '@tanstack/vue-router'
import MarkerPlanCreatePage from '@/pages/marker-plan/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/marker-plan/create')({
    beforeLoad: () => {
        requirePermission('MARKER_PLAN_CREATE')()
    },
    component: MarkerPlanCreatePage,
    staticData: {
        breadcrumb: 'Tambah Marker Plan'
    }
})
