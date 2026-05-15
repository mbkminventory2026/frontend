import { createFileRoute } from '@tanstack/vue-router'
import CompanyPage from '@/pages/company/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'

const CompanySearchKeys = [
    'about',
    'alamat',
    'created_at',
    'email',
    'id_company',
    'logo',
    'nama',
    'no_telp'
] as const

export const companySchema = createTableParamsSchema([...CompanySearchKeys])

export const Route = createFileRoute('/_authenticated/company')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = companySchema.parse(search)
    return stripTableDefaults(parsed)
  },
  beforeLoad: ({ search, location }) => {
    validateTableSearchRedirect(
        '/_authenticated/company',
        location.search as Record<string, any>,
        search
    )
  },
  component: CompanyPage,
  staticData: {
    breadcrumb: 'Company'
  }
})
