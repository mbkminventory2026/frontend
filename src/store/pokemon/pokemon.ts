import { defineStore } from "pinia";
import { ref } from "vue";
import type { PokemonListItem } from "@/schemas/pokemon/pokemon";

export const usePokemonStore = defineStore('pokemon', () => {
    // state
    const favoritePokemons = ref<PokemonListItem[]>([]);
    
    // action
    const toggleFavorite = (pokemon: PokemonListItem) => {
        // value nya adalah index ke berapa pokemon tersebut ada di list favPokemon
        const index = favoritePokemons.value.findIndex(favPokemon => favPokemon.name === pokemon.name) 

        if(index === -1) {
            // jika tidak ditemukan maka akan return -1
            // lalu akan dipush ke list favoritePokemons
            favoritePokemons.value.push(pokemon);
        } else {
            // jika ditemukan, maka akan dihapus
            // splice(startIndex, deleteCount)
            favoritePokemons.value.splice(index, 1);
        }
    };

    // getter -> cek pada favoritePokemons, apakah ada nama yang sama dengan nama di parameter
    const isFavorite = (name: string) => {
        return favoritePokemons.value.some(favPokemon => favPokemon.name === name);
    };

    return {
        favoritePokemons,
        toggleFavorite,
        isFavorite,
    }
})