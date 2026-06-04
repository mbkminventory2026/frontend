import { createFileRoute } from '@tanstack/vue-router'
import ForbiddenPage from '@/pages/forbidden.vue'

export const Route = createFileRoute('/_authenticated/forbidden')({
    component: ForbiddenPage,
    staticData: {
        breadcrumb: 'Akses Ditolak'
    }
})
