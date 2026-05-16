import { createFileRoute } from '@tanstack/vue-router'
import JenisBarangDetailPage from '@/pages/jenis-barang/detail/page.vue'

export const Route = createFileRoute('/_authenticated/jenis-barang/$id')({
    component: JenisBarangDetailPage,
    staticData: {
        breadcrumb: 'Detail Jenis Barang'
    }
})
