import { createFileRoute } from '@tanstack/vue-router'
import PokemonPage from '@/pages/pokemon/list/page.vue'

export const Route = createFileRoute('/pokemon')({
  component: PokemonPage,
})

