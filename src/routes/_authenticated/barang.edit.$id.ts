import { createFileRoute } from '@tanstack/vue-router'
import BarangEditPage from '@/pages/barang/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/barang/edit/$id')({
    beforeLoad: () => {
        requirePermission('MASTER_BARANG_UPDATE')()
    },
    component: BarangEditPage,
    staticData: {
        breadcrumb: 'Edit Barang'
    }
})
