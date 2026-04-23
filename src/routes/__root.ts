import { createRootRoute } from '@tanstack/vue-router'
import Root from '../layouts/Root.vue'
import NotFound from '@/pages/NotFound.vue'

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
})
