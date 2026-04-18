import { createFileRoute } from '@tanstack/vue-router'
import PokemonPage from '@/pages/pokemon/list/page.vue'
import { createTableParamsSchema } from '@/schemas/table-params'
import { AlbumKeys } from '@/schemas/coba/coba'

export const albumSearchSchema = createTableParamsSchema([...AlbumKeys] as [string, ...string[]])

export const Route = createFileRoute('/pokemon')({
  validateSearch: (search) => albumSearchSchema.parse(search),
  component: PokemonPage
})