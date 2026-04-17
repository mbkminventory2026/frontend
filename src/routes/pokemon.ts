import { createFileRoute } from '@tanstack/vue-router'
import PokemonPage from '@/pages/pokemon/list/page.vue'
import { tabelParamsSchema } from '@/schemas/table-params'

export const Route = createFileRoute('/pokemon')({
  validateSearch: (search) => tabelParamsSchema.parse(search),
  component: PokemonPage
})

