import { createFileRoute } from '@tanstack/vue-router'
import WarnaEditPage from '@/pages/warna/edit/page.vue'

export const Route = createFileRoute('/_authenticated/warna/edit/$id')({
    component: WarnaEditPage,
    staticData: {
        breadcrumb: 'Edit Warna'
    }
})
