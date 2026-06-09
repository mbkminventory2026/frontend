import { createFileRoute } from '@tanstack/vue-router'
import ProductionLineDetailPage from '@/pages/production-line/detail/page.vue'

export const Route = createFileRoute('/_authenticated/production-line/$id')({
    component: ProductionLineDetailPage,
    staticData: {
        breadcrumb: 'Detail Production Line'
    }
})
