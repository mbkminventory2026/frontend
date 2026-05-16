import { createFileRoute } from '@tanstack/vue-router'
import DepartemenDetailPage from '@/pages/departemen/detail/page.vue'

export const Route = createFileRoute('/_authenticated/departemen/$id')({
    component: DepartemenDetailPage,
    staticData: {
        breadcrumb: 'Detail Departemen'
    }
})
