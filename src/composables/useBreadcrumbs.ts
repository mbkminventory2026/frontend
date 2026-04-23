import { useRouterState } from "@tanstack/vue-router";
import { computed } from "vue";

export function useBreadcrumbs() {
    const state = useRouterState()

    const breadcrumbs = computed(() => {
        const home = { label: 'Home', href: '/', active: state.value.location.pathname === '/' }

        const matches = state.value.matches
            .filter(m => m.routeId !== '__root__' && m.pathname !== '/')
            .map((match) => ({
                label: (match.staticData as any)?.breadcrumb ?? match.routeId,
                href: match.pathname,
                active: match.pathname === state.value.location.pathname
            }))
            return [home, ...matches]
        })

    return { breadcrumbs }
}