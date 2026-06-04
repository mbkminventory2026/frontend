import { createFileRoute } from '@tanstack/vue-router'
import DepartemenEditPage from '@/pages/departemen/edit/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/departemen/edit/$id')({
    beforeLoad: () => {
        requirePermission('MASTER_DEPARTEMEN_UPDATE')()
    },
    component: DepartemenEditPage,
    staticData: {
        breadcrumb: 'Edit Departemen'
    }
})
