import { ref, watch } from "vue";
import { getPokemons } from "@/api/pokemon.api";
import type { PokemonListItem, PokemonListResponse } from "@/schemas/pokemon.schema";

const pokemonCache = new Map<number, PokemonListResponse>();

export function usePokemonTable() {
    // local storage
    const pokemons = ref<PokemonListItem[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // pagination state
    const totalCount = ref(0);
    const currentPage = ref(1);
    const itemsPerPage = ref(10);

    const fetchPokemons = async (page: number, isPrefetch: boolean = false) => {
        if (pokemonCache.has(page)) {
            if(!isPrefetch) {
                const cachedData = pokemonCache.get(page)!;
                pokemons.value = cachedData.results;
                totalCount.value = cachedData.count;
            }
            return;
        }

        if (!isPrefetch) {
            isLoading.value = true;
            error.value = null;
        }

        try {
            const offset = (page - 1) * itemsPerPage.value;

            console.log(`[Fetch] Memanggil Halaman ${page} | Offset: ${offset} | Prefetch: ${isPrefetch}`);

            const response = await getPokemons( itemsPerPage.value, offset);

            pokemonCache.set(page, response);

            if (!isPrefetch) { 
                pokemons.value = response.results;
                totalCount.value = response.count;
            }
        } catch(err: any) {
            if (!isPrefetch) {
                error.value = err.message || 'Gagal mengambil data dari Pokemon Server';
            }
        } finally {
            if (!isPrefetch) {
                isLoading.value = false;
            }
        }
    };

    // observe changes in reactive data (like ref, reactive, or computed properties) and perform side effects, such as making API calls or updating other states, in response to those changes
    // watch(source, callback, options);
    watch(
    currentPage, 
    async (newPage) => {
        await fetchPokemons(newPage, false);
        fetchPokemons(newPage + 1, true);
    }, 
    { immediate: true });

    return {
        pokemons,
        isLoading,
        error,
        totalCount,
        currentPage,
        itemsPerPage,
        fetchPokemons
    }
}