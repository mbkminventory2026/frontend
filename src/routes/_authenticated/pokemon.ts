import { pokemonSearchSchema } from '@/pages/pokemon/list/schema';
import { createFileRoute } from '@tanstack/vue-router'
import PokemonPage from '@/pages/pokemon/list/page.vue'

import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils';
import { requirePermission } from '@/lib/requirePermission'

export const Route = createFileRoute('/_authenticated/pokemon')({
  // validateSearch hanya untuk parsing — TIDAK boleh throw redirect di sini
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = pokemonSearchSchema.parse(search)
    return stripTableDefaults(parsed)
  },

  // Redirect logic ada di beforeLoad — di sini throw redirect() baru bekerja
  beforeLoad: ({ search, location }) => {
    requirePermission('DASHBOARD_READ')()
    validateTableSearchRedirect(
      '/_authenticated/pokemon',
      location.search as Record<string, any>,
      search
    )
  },

  component: PokemonPage,
  staticData: {
    breadcrumb: 'Pokemons'
  }
})
