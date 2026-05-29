import { createFileRoute } from '@tanstack/vue-router'
import ReportPenerimaanDetailPage from '@/pages/reportPenerimaan/detail/page.vue';

export const Route = createFileRoute('/_authenticated/report-penerimaan/$id')({
    component: ReportPenerimaanDetailPage,
    staticData: {
        breadcrumb: 'Detail'
    }
})
