import { createFileRoute } from '@tanstack/vue-router'
import MitraDetailPage from '@/pages/mitra/detail/page.vue'

export const Route = createFileRoute('/_authenticated/mitra/$id')({
    component: MitraDetailPage,
    staticData: {
        breadcrumb: 'Detail Mitra'
    }
})
