import { createFileRoute } from '@tanstack/vue-router'
import POClientDetailPage from '@/pages/po-client/detail/page.vue'

export const Route = createFileRoute('/_authenticated/po-client/$id')({
    component: POClientDetailPage,
    staticData: {
        breadcrumb: 'Detail PO Client'
    }
})
