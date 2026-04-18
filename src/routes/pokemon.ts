import { createFileRoute } from '@tanstack/vue-router'
import PokemonPage from '@/pages/pokemon/list/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect, stripTableDefaults } from '@/lib/table-utils';

export const pokemonColumns: [string, ...string[]] = ['albumId', 'id', 'title', 'url', 'thumbnailUrl'];
export const pokemonSearchSchema = createTableParamsSchema(pokemonColumns)

export const Route = createFileRoute('/pokemon')({
  // validateSearch hanya untuk parsing — TIDAK boleh throw redirect di sini
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = pokemonSearchSchema.parse(search)
    return stripTableDefaults(parsed)
  },

  // Redirect logic ada di beforeLoad — di sini throw redirect() baru bekerja
  beforeLoad: ({ search, location }) => {
    validateTableSearchRedirect(
      '/pokemon',
      location.search as Record<string, any>,
      search
    )
  },

  component: PokemonPage,
})