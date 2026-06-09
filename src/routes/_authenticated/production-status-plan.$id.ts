import { createFileRoute } from '@tanstack/vue-router'
import ProductionStatusPlanDetailPage from '@/pages/production-status-plan/detail/page.vue'

export const Route = createFileRoute('/_authenticated/production-status-plan/$id')({
    component: ProductionStatusPlanDetailPage,
    staticData: {
        breadcrumb: 'Detail Status Plan'
    }
})
