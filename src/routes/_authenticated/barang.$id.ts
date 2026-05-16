import { createFileRoute } from '@tanstack/vue-router'
import BarangDetailPage from '@/pages/barang/detail/page.vue'

export const Route = createFileRoute('/_authenticated/barang/$id')({
    component: BarangDetailPage,
    staticData: {
        breadcrumb: 'Detail Barang'
    }
})
