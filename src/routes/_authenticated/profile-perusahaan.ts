import { createFileRoute } from '@tanstack/vue-router'
import ProfilePerusahaanPage from '@/pages/profile-perusahaan/page.vue'

import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils'
import { requirePermission } from '@/lib/requirePermission'

const ProfilePerusahaanSearchKeys = [
    'about',
    'alamat',
    'created_at',
    'email',
    'id_profile_perusahaan',
    'logo',
    'nama',
    'no_telp'
] as const

export const profilePerusahaanSchema = createTableParamsSchema([...ProfilePerusahaanSearchKeys])

export const Route = createFileRoute('/_authenticated/profile-perusahaan')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = profilePerusahaanSchema.parse(search)
    return stripTableDefaults(parsed)
  },
  beforeLoad: ({ search, location }) => {
    requirePermission('MASTER_PROFILE_PERUSAHAAN_READ')()
    validateTableSearchRedirect(
        '/_authenticated/profile-perusahaan',
        location.search as Record<string, any>,
        search
    )
  },
  component: ProfilePerusahaanPage,
  staticData: {
    breadcrumb: 'Profile Perusahaan'
  }
})
