import { apiClient } from "@/lib/apiClient";
import type { PokemonListResponse } from "@/schemas/pokemon/pokemon";

export const getPokemons = async (params: {
        limit: number,
        offset: number,
        search?: string
    }
): Promise<PokemonListResponse> => {
    const response = await apiClient.get<PokemonListResponse>('/pokemon', {
        params
    });

    return response.data
}