import { createFileRoute } from '@tanstack/vue-router'
import JenisBarangCreatePage from '@/pages/jenis-barang/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/jenis-barang/create')({
    beforeLoad: () => {
        requirePermission('MASTER_JENIS_BARANG_CREATE')()
    },
    component: JenisBarangCreatePage,
    staticData: {
        breadcrumb: 'Tambah Jenis Barang'
    }
})
