import { createFileRoute } from '@tanstack/vue-router'
import DepartemenCreatePage from '@/pages/departemen/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/departemen/create')({
    beforeLoad: () => {
        requirePermission('MASTER_DEPARTEMEN_CREATE')()
    },
    component: DepartemenCreatePage,
    staticData: {
        breadcrumb: 'Tambah Departemen'
    }
})
