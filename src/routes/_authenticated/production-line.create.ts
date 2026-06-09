import { createFileRoute } from '@tanstack/vue-router'
import CreateProductionLinePage from '@/pages/production-line/create/page.vue'

export const Route = createFileRoute('/_authenticated/production-line/create')({
    component: CreateProductionLinePage,
    staticData: {
        breadcrumb: 'Tambah Line Produksi',
    },
})
