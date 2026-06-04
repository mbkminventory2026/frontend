import { createFileRoute } from '@tanstack/vue-router'
import BarangCreatePage from '@/pages/barang/create/page.vue'

export const Route = createFileRoute('/_authenticated/barang/create')({
    component: BarangCreatePage,
    staticData: {
        breadcrumb: 'Tambah Barang'
    }
})
