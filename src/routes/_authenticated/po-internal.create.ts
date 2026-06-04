import { createFileRoute } from '@tanstack/vue-router'
import POInternalCreatePage from '@/pages/po-internal/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-internal/create')({
    beforeLoad: () => {
        requirePermission('PO_INTERNAL_CREATE')()
    },
    component: POInternalCreatePage,
    staticData: {
        breadcrumb: 'Tambah PO Internal'
    }
})
