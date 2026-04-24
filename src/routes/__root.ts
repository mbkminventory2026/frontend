import { createRootRoute } from '@tanstack/vue-router'
import RootContent from '../layouts/RootContent.vue'
import NotFound from '@/pages/NotFound.vue'

export const Route = createRootRoute({
  component: RootContent,
  notFoundComponent: NotFound,
})
