import { createFileRoute } from '@tanstack/vue-router'
import JenisBarangCreatePage from '@/pages/jenis-barang/create/page.vue'

export const Route = createFileRoute('/_authenticated/jenis-barang/create')({
    component: JenisBarangCreatePage,
    staticData: {
        breadcrumb: 'Tambah Jenis Barang'
    }
})
