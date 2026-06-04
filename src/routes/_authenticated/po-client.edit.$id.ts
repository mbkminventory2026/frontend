import { createFileRoute } from '@tanstack/vue-router'
import POClientCreatePage from '@/pages/po-client/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/po-client/edit/$id')({
    beforeLoad: () => {
        requirePermission('PO_CLIENT_UPDATE')()
    },
    component: POClientCreatePage,
    staticData: {
        breadcrumb: 'Edit PO Client'
    }
})
