import { createFileRoute } from '@tanstack/vue-router'
import JenisBarangEditPage from '@/pages/jenis-barang/edit/page.vue'

export const Route = createFileRoute('/_authenticated/jenis-barang/edit/$id')({
    component: JenisBarangEditPage,
    staticData: {
        breadcrumb: 'Edit Jenis Barang'
    }
})
