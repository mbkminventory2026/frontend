import { createRouter } from '@tanstack/vue-router'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/vue-router' {
  interface Register {
    router: typeof router
  }
}
