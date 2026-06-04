import { createFileRoute } from '@tanstack/vue-router'
import BarangEditPage from '@/pages/barang/edit/page.vue'

export const Route = createFileRoute('/_authenticated/barang/edit/$id')({
    component: BarangEditPage,
    staticData: {
        breadcrumb: 'Edit Barang'
    }
})
