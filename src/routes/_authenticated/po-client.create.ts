import { createFileRoute } from '@tanstack/vue-router'
import POClientCreatePage from '@/pages/po-client/create/page.vue'

export const Route = createFileRoute('/_authenticated/po-client/create')({
    component: POClientCreatePage,
    staticData: {
        breadcrumb: 'Tambah PO Client'
    }
})
