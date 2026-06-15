import { createFileRoute } from '@tanstack/vue-router'
import SizeCreatePage from '@/pages/size/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/size/create')({
    beforeLoad: () => {
        requirePermission('MASTER_SIZE_CREATE')()
    },
    component: SizeCreatePage,
    staticData: {
        breadcrumb: 'Tambah Size'
    }
})
