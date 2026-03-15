import { createFileRoute } from '@tanstack/vue-router'
import PokemonListPage from '@/pages/PokemonListPage.vue'

export const Route = createFileRoute('/')({
  component: PokemonListPage,
})
