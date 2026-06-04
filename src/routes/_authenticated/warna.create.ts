import { createFileRoute } from '@tanstack/vue-router'
import WarnaCreatePage from '@/pages/warna/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/warna/create')({
    beforeLoad: () => {
        requirePermission('MASTER_WARNA_CREATE')()
    },
    component: WarnaCreatePage,
    staticData: {
        breadcrumb: 'Tambah Warna'
    }
})
