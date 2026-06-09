import { createFileRoute } from '@tanstack/vue-router'
import CreateProductionStatusPlanPage from '@/pages/production-status-plan/create/page.vue'

export const Route = createFileRoute('/_authenticated/production-status-plan/create')({
    component: CreateProductionStatusPlanPage,
    staticData: {
        breadcrumb: 'Tambah Status Plan Produksi',
    },
})
