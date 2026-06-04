import { createFileRoute } from '@tanstack/vue-router'
import PRInternalDetailPage from '@/pages/pr-internal/detail/page.vue'

export const Route = createFileRoute('/_authenticated/pr-internal/$id')({
    component: PRInternalDetailPage,
    staticData: {
        breadcrumb: 'Detail PR Internal'
    }
})
