import { createFileRoute } from '@tanstack/vue-router'
import JenisBarangEditPage from '@/pages/jenis-barang/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/jenis-barang/edit/$id')({
    beforeLoad: () => {
        requirePermission('MASTER_JENIS_BARANG_UPDATE')()
    },
    component: JenisBarangEditPage,
    staticData: {
        breadcrumb: 'Edit Jenis Barang'
    }
})
