import { createFileRoute } from '@tanstack/vue-router'
import ProfilPerusahaanPage from '@/pages/profil-perusahaan/page.vue'

import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

const ProfilPerusahaanSearchKeys = [
    'about',
    'alamat',
    'created_at',
    'email',
    'id_profil_perusahaan',
    'logo',
    'nama',
    'no_telp',
    'background_login',
    'text_footer',
    'link_website',
    'medsos'
] as const

export const profilPerusahaanSchema = createTableParamsSchema([...ProfilPerusahaanSearchKeys])

export const Route = createFileRoute('/_authenticated/profil-perusahaan')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = profilPerusahaanSchema.parse(search)
    return stripTableDefaults(parsed)
  },
  beforeLoad: ({ search, location }) => {
    requirePermission('MASTER_PROFIL_PERUSAHAAN_READ')()
    validateTableSearchRedirect(
        '/_authenticated/profil-perusahaan',
        location.search as Record<string, any>,
        search
    )
  },
  component: ProfilPerusahaanPage,
  staticData: {
    breadcrumb: 'Profil Perusahaan'
  }
})
