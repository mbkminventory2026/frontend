import { createFileRoute } from '@tanstack/vue-router'
import ReportPengirimanDetailPage from '@/pages/reportPengiriman/detail/page.vue';

export const Route = createFileRoute('/_authenticated/report-pengiriman/$id')({
    component: ReportPengirimanDetailPage,
    staticData: {
        breadcrumb: 'Detail'
    }
})
