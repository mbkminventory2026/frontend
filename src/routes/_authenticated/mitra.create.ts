import { createFileRoute } from '@tanstack/vue-router'
import MitraCreatePage from '@/pages/mitra/create/page.vue'

export const Route = createFileRoute('/_authenticated/mitra/create')({
    component: MitraCreatePage,
    staticData: {
        breadcrumb: 'Tambah Mitra'
    }
})
