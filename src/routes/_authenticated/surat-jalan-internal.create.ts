import { createFileRoute } from '@tanstack/vue-router'
import SuratJalanInternalCreatePage from '@/pages/surat-jalan-internal/create/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/surat-jalan-internal/create')({
    beforeLoad: () => {
        requirePermission('SURAT_JALAN_INTERNAL_CREATE')()
    },
    component: SuratJalanInternalCreatePage,
    staticData: {
        breadcrumb: 'Buat Surat Jalan Internal'
    }
})
