<script setup lang="ts">
import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';

import { usePokemonTable } from '@/composables/usePokemonTable';
import { usePokemonStore } from '@/store/pokemon/pokemon';
import type { PokemonListItem } from '@/schemas/pokemon/pokemon';

import { PokemonKeys, PokemonLabels } from '@/schemas/pokemon/pokemon';
import { createColumns } from '@/lib/table-utils';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';

// logic dan state
const { pokemons, isLoading, error, currentPage } = usePokemonTable();
const pokemonStore = usePokemonStore();

const baseColumns = createColumns<PokemonListItem>(PokemonKeys, PokemonLabels);

const columns: ColumnDef<PokemonListItem>[] = [
    ...baseColumns,
    {
        id: 'actions',
        header: () => h('div', { class: 'text-right' }, 'Aksi'),
        cell: ({ row }) => {
            // row.original itu mengambil refernsi dari ColumnDef<PokemonListItem>
            const pokemon = row.original; // mendapatkan data asli dari row
            const isFav = pokemonStore.isFavorite(pokemon.name)

            return h('div', { class: 'text-right' }, [
                h(Button, {
                    variant: isFav ? 'default' : 'outline',
                    size: 'sm',
                    onClick: () => pokemonStore.toggleFavorite(pokemon)
                }, () => isFav ? 'Tersimpan' : 'Favorit')   // isi button
            ])
        }
    }
]

// navigasi
const nextPage = () => currentPage.value += 1;
const prevPage = () => { if (currentPage.value > 1) currentPage.value -= 1; };
</script>

<template>
    <div class=" p-8 max-w-4xl mx-auto space-y-6">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">PokeDex Explorer</h1>
        </div>

        <div v-if="error" class="bg-red-100 text-red-700 p-4 rounded-md">{{ error }}
        </div>

        <DataTable
        :data="pokemons"
        :columns="columns"
        :is-loading="isLoading"/>

        <div class="flex items-center justify-between">
            <p class="text-sm text-muted-foreground">Halaman {{ currentPage }}</p>
            <div class="space-x-2">
                <Button variant="outline" :disabled="currentPage === 1 || isLoading" @click="prevPage">Prev</Button>
                <Button variant="outline" :disabled="isLoading" @click="nextPage">Next</Button>
            </div>
        </div>
    </div>
</template>