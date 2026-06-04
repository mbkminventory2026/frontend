import { createFileRoute } from '@tanstack/vue-router'
import DepartemenCreatePage from '@/pages/departemen/create/page.vue'

export const Route = createFileRoute('/_authenticated/departemen/create')({
    component: DepartemenCreatePage,
    staticData: {
        breadcrumb: 'Tambah Departemen'
    }
})
