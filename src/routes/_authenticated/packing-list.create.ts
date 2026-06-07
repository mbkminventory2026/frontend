import { createFileRoute } from '@tanstack/vue-router'
import PackingListCreatePage from '@/pages/packing-list/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/packing-list/create')({
    beforeLoad: () => {
        requirePermission('PACKING_LIST_CREATE')()
    },
    component: PackingListCreatePage,
    staticData: {
        breadcrumb: 'Tambah Packing List'
    }
})
