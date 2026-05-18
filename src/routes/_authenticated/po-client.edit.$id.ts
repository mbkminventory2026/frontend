import { createFileRoute } from '@tanstack/vue-router'
import POClientCreatePage from '@/pages/po-client/create/page.vue'

export const Route = createFileRoute('/_authenticated/po-client/edit/$id')({
    component: POClientCreatePage,
    staticData: {
        breadcrumb: 'Edit PO Client'
    }
})
