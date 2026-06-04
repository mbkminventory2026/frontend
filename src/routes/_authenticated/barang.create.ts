import { createFileRoute } from '@tanstack/vue-router'
import BarangCreatePage from '@/pages/barang/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/barang/create')({
    beforeLoad: () => {
        requirePermission('MASTER_BARANG_CREATE')()
    },
    component: BarangCreatePage,
    staticData: {
        breadcrumb: 'Tambah Barang'
    }
})
