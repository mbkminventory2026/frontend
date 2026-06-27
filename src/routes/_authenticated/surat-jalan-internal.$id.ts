import { createFileRoute } from '@tanstack/vue-router'
import SuratJalanInternalDetailPage from '@/pages/surat-jalan-internal/detail/page.vue'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/surat-jalan-internal/$id')({
    beforeLoad: () => {
        requirePermission('SURAT_JALAN_INTERNAL_READ')()
    },
    component: SuratJalanInternalDetailPage,
    staticData: {
        breadcrumb: 'Detail Surat Jalan Internal'
    }
})
