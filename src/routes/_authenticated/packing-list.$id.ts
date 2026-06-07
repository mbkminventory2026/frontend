import { createFileRoute } from '@tanstack/vue-router'
import PackingListDetailPage from '@/pages/packing-list/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/packing-list/$id')({
    beforeLoad: () => {
        requirePermission('PACKING_LIST_READ')()
    },
    component: PackingListDetailPage,
    staticData: {
        breadcrumb: 'Detail Packing List'
    }
})
