import { createFileRoute } from '@tanstack/vue-router'
import EditProductionLinePage from '@/pages/production-line/edit/page.vue'

export const Route = createFileRoute('/_authenticated/production-line/edit/$id')({
    component: EditProductionLinePage,
    staticData: {
        breadcrumb: 'Edit Line Produksi',
    },
})
