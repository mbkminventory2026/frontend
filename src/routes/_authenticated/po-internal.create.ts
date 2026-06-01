import { createFileRoute } from '@tanstack/vue-router'
import POInternalCreatePage from '@/pages/po-internal/create/page.vue'

export const Route = createFileRoute('/_authenticated/po-internal/create')({
    component: POInternalCreatePage,
    staticData: {
        breadcrumb: 'Tambah PO Internal'
    }
})
