import { createFileRoute } from '@tanstack/vue-router'
import { requirePermission } from '@/lib/requirePermission'
import { validateTableSearchRedirect } from '@/lib/table-utils'
import RekonsiliasiPage from '@/pages/rekonsiliasi/page.vue'
import { rekonsiliasiSchema, rekonsiliasiSearchKeys, stripRekonsiliasiDefaults } from '@/pages/rekonsiliasi/schema'

export const Route = createFileRoute('/_authenticated/rekonsiliasi/')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = rekonsiliasiSchema.parse(search)
    return stripRekonsiliasiDefaults(parsed)
  },
  beforeLoad: ({ search, location }) => {
    requirePermission('REKONSILIASI_READ')()

    validateTableSearchRedirect(
      '/_authenticated/rekonsiliasi',
      location.search as Record<string, any>,
      search,
      rekonsiliasiSearchKeys,
    )
  },
  component: RekonsiliasiPage,
  staticData: {
    breadcrumb: 'Rekonsiliasi',
  },
})
