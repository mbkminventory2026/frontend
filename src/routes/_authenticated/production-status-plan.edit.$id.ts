import { createFileRoute } from '@tanstack/vue-router'
import EditProductionStatusPlanPage from '@/pages/production-status-plan/edit/page.vue'

export const Route = createFileRoute('/_authenticated/production-status-plan/edit/$id')({
    component: EditProductionStatusPlanPage,
    staticData: {
        breadcrumb: 'Edit Status Plan Produksi',
    },
})
