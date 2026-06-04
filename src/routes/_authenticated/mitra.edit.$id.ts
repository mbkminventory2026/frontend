import { createFileRoute } from '@tanstack/vue-router'
import MitraEditPage from '@/pages/mitra/edit/page.vue'

export const Route = createFileRoute('/_authenticated/mitra/edit/$id')({
    component: MitraEditPage,
    staticData: {
        breadcrumb: 'Edit Mitra'
    }
})
