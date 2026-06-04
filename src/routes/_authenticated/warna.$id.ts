import { createFileRoute } from '@tanstack/vue-router'
import WarnaDetailPage from '@/pages/warna/detail/page.vue'

export const Route = createFileRoute('/_authenticated/warna/$id')({
    component: WarnaDetailPage,
    staticData: {
        breadcrumb: 'Detail Warna'
    }
})
