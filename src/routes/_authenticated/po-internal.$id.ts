import { createFileRoute } from '@tanstack/vue-router'
import POInternalDetailPage from '@/pages/po-internal/detail/page.vue'

export const Route = createFileRoute('/_authenticated/po-internal/$id')({
    component: POInternalDetailPage,
    staticData: {
        breadcrumb: 'Detail PO Internal'
    }
})
