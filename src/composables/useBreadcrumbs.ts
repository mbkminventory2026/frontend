import { useRouterState } from "@tanstack/vue-router";
import { computed } from "vue";

export function useBreadcrumbs() {
    const state = useRouterState()

    const breadcrumbs = computed(() => {
        const home = { label: 'Home', href: '/', active: state.value.location.pathname === '/' }

        const matches = state.value.matches
            .filter(m => m.routeId !== '__root__' && m.pathname !== '/')
            .map((match) => {
                const parts = match.routeId.replace(/^\/|\/$/g, '').split('/')
                const activeParts = parts.filter((part: string) => !part.startsWith('_') && !part.startsWith('$'))
                
                if (activeParts.length === 0) return null

                const lastSegment = activeParts[activeParts.length - 1] || ''
                const defaultLabel = lastSegment
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())

                return {
                    label: (match.staticData as any)?.breadcrumb ?? defaultLabel,
                    href: match.pathname,
                    active: match.pathname === state.value.location.pathname
                }
            })
            .filter((item): item is { label: string; href: string; active: boolean } => item !== null)

        const uniqueBreadcrumbs = []
        const seenHrefs = new Set<string>()
        
        for (const item of matches) {
            if (!seenHrefs.has(item.href)) {
                seenHrefs.add(item.href)
                uniqueBreadcrumbs.push(item)
            }
        }

        return [home, ...uniqueBreadcrumbs]
    })

    return { breadcrumbs }
}
