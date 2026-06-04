import { createFileRoute } from '@tanstack/vue-router'
import DepartemenEditPage from '@/pages/departemen/edit/page.vue'

export const Route = createFileRoute('/_authenticated/departemen/edit/$id')({
    component: DepartemenEditPage,
    staticData: {
        breadcrumb: 'Edit Departemen'
    }
})
