import { suratJalanInternalSchema } from '@/pages/surat-jalan-internal/schema';
import { createFileRoute } from '@tanstack/vue-router'
import SuratJalanInternalPage from '@/pages/surat-jalan-internal/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/surat-jalan-internal/')({
    validateSearch: (search: Record<string, unknown>) => {
        const parsed = suratJalanInternalSchema.parse(search)
        return stripTableDefaults(parsed)
    },

    beforeLoad: ({ search, location }) => {
        requirePermission('SURAT_JALAN_INTERNAL_READ')()
        validateTableSearchRedirect(
            '/_authenticated/surat-jalan-internal',
            location.search as Record<string, any>,
            search
        )
    },
    component: SuratJalanInternalPage,
    staticData: {
        breadcrumb: 'Surat Jalan Internal'
    }
})
