import { apiClient } from "@/lib/apiClient";
import type { PokemonListResponse } from "@/schemas/pokemon.schema";

export const getPokemons = async (
    limit: number = 20,
    offset: number = 0,
): Promise<PokemonListResponse> => {
    const response = await apiClient.get<PokemonListResponse>('/pokemon', {
        params: { limit, offset }
    });

    return response.data
}