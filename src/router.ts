import { createRouter } from '@tanstack/vue-router'
import { routeTree } from './routeTree.gen'
import { h } from 'vue'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: () => h('div', 'Global Not Found'),
})

declare module '@tanstack/vue-router' {
  interface Register {
    router: typeof router
  }
}
