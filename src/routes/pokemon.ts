import { createFileRoute } from '@tanstack/vue-router'
import PokemonPage from '@/pages/pokemon/list/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { validateTableSearchRedirect } from '@/lib/table-utils';

// Gunakan kolom yang benar-benar ada di tabel Anda di page.vue
export const pokemonColumns: [string, ...string[]] = ['albumId', 'id', 'title', 'url', 'thumbnailUrl'];
export const pokemonSearchSchema = createTableParamsSchema(pokemonColumns)

export const Route = createFileRoute('/pokemon')({
  // validateSearch hanya untuk parsing — TIDAK boleh throw redirect di sini
  validateSearch: (search: Record<string, unknown>) => {
    return pokemonSearchSchema.parse(search)
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