import { createFileRoute } from '@tanstack/vue-router'
import POClientCreatePage from '@/pages/po-client/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-client/create')({
    beforeLoad: () => {
        requirePermission('PO_CLIENT_CREATE')()
    },
    component: POClientCreatePage,
    staticData: {
        breadcrumb: 'Tambah PO Client'
    }
})
