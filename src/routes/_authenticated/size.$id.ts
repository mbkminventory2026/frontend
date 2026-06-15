import { createFileRoute } from '@tanstack/vue-router'
import SizeDetailPage from '@/pages/size/detail/page.vue'

export const Route = createFileRoute('/_authenticated/size/$id')({
    component: SizeDetailPage,
    staticData: {
        breadcrumb: 'Detail Size'
    }
})
