# Tutorial: Alur Pengembangan Fitur Pokemon (Vue 3 + TanStack Table & Router + Pinia)

Dokumentasi ini menjelaskan langkah-langkah implementasi fitur daftar Pokemon secara end-to-end, mulai dari routing, pendefinisian data, hingga pembuatan komponen table yang dinamis.

---

## Daftar Isi
1. [Konfigurasi TanStack Router](#1-konfigurasi-tanstack-router)
2. [Pendefinisian Schema](#2-pendefinisian-schema)
3. [Pembuatan API Service](#3-pembuatan-api-service)
4. [Manajemen State (Pinia)](#4-manajemen-state-pinia)
5. [Logika Bisnis (Composables)](#5-logika-bisnis-composables)
6. [Komponen Table Dinamis (Generics)](#6-komponen-table-dinamis-generics)
7. [Visualisasi pada Halaman](#7-visualisasi-pada-halaman)

---

## 1. Konfigurasi TanStack Router
TanStack Router menggunakan pendekatan *file-based routing*. Kita perlu menyiapkan Root Route dan mendefinisikan rute untuk halaman Pokemon.

**File:** `src/routes/__root.ts` (Layout Utama)
```typescript
import { createRootRoute, Outlet, Link } from '@tanstack/vue-router'

export const route = createRootRoute({
  component: () => h('div', [
    h('nav', [
      h(Link, { to: '/' }, 'Home'),
      h(Link, { to: '/pokemon' }, 'Pokemon List'),
    ]),
    h(Outlet) // Tempat merender halaman anak
  ]),
})
```

**File:** `src/routes/pokemon.ts`
```typescript
import { createRoute } from '@tanstack/vue-router'
import { route as rootRoute } from './__root'
import PokemonListPage from '@/pages/PokemonListPage.vue'

export const pokemonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pokemon',
  component: PokemonListPage,
})
```

---

## 2. Pendefinisian Schema
Tentukan kontrak data menggunakan TypeScript interface untuk keamanan tipe data di seluruh aplikasi.

**File:** `src/schemas/pokemon/pokemon.ts`
```typescript
export interface PokemonListItem {
    name: string;
    url: string;
}

export interface PokemonListResponse {
    count: number;
    results: PokemonListItem[];
}
```

---

## 3. Pembuatan API Service
Buat fungsi untuk memanggil API eksternal menggunakan Axios.

**File:** `src/api/pokemon/pokemon.ts`
```typescript
import { apiClient } from "@/lib/apiClient";
import type { PokemonListResponse } from "@/schemas/pokemon/pokemon";

export const getPokemons = async (limit: number = 10, offset: number = 0) => {
    const response = await apiClient.get<PokemonListResponse>('/pokemon', {
        params: { limit, offset }
    });
    return response.data;
}
```

---

## 4. Manajemen State (Pinia)
Gunakan Pinia untuk menyimpan data favorit yang bisa diakses dari halaman mana saja.

**File:** `src/store/pokemon.store.ts`
```typescript
export const usePokemonStore = defineStore('pokemon', () => {
    const favoritePokemons = ref<PokemonListItem[]>([]);
    const isFavorite = (name: string) => favoritePokemons.value.some(p => p.name === name);
    const toggleFavorite = (pokemon: PokemonListItem) => {
        const idx = favoritePokemons.value.findIndex(p => p.name === pokemon.name);
        if (idx === -1) favoritePokemons.value.push(pokemon);
        else favoritePokemons.value.splice(idx, 1);
    };
    return { favoritePokemons, toggleFavorite, isFavorite };
});
```

---

## 5. Logika Bisnis (Composables)
Composable menangani logika rumit seperti **Caching** dan **Prefetching** agar halaman tetap bersih.

**File:** `src/composables/usePokemonTable.ts`
```typescript
const pokemonCache = new Map<number, PokemonListResponse>();

export function usePokemonTable() {
    const pokemons = ref<PokemonListItem[]>([]);
    const currentPage = ref(1);

    const fetchPokemons = async (page: number, isPrefetch: boolean = false) => {
        if (pokemonCache.has(page)) {
            if (!isPrefetch) pokemons.value = pokemonCache.get(page)!.results;
            return;
        }
        const offset = (page - 1) * 10;
        const response = await getPokemons(10, offset);
        pokemonCache.set(page, response);
        if (!isPrefetch) pokemons.value = response.results;
    };

    watch(currentPage, (newPage) => {
        fetchPokemons(newPage, false);
        fetchPokemons(newPage + 1, true); // Prefetch halaman selanjutnya
    }, { immediate: true });

    return { pokemons, currentPage };
}
```

---

## 6. Komponen Table Dinamis (Generics)
Agar `DataTable` bisa digunakan untuk data apa pun (Pokemon, User, Equipment), kita menggunakan **TypeScript Generics**.

**File:** `src/components/DataTable.vue`
```vue
<script setup lang="ts" generic="TData, TValue">
import { useVueTable, FlexRender, getCoreRowModel } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'

// Generics TData menangkap tipe data yang dikirim dari parent
const props = defineProps<{
    data: TData[],
    columns: ColumnDef<TData, TValue>[],
    isLoading?: boolean
}>()

const table = useVueTable({
    get data() { return props.data },
    get columns() { return props.columns },
    getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <table>
    <thead>
      <tr v-for="headerGroup in table.getHeaderGroups()">
        <th v-for="header in headerGroup.headers">
          <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in table.getRowModel().rows">
        <td v-for="cell in row.getVisibleCells()">
          <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

---

## 7. Visualisasi pada Halaman
Terakhir, gabungkan semua bagian di dalam file halaman.

**File:** `src/pages/PokemonListPage.vue`
```vue
<script setup lang="ts">
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { usePokemonTable } from '@/composables/usePokemonTable'
import { usePokemonStore } from '@/store/pokemon/pokemon'
import type { PokemonListItem } from '@/schemas/pokemon/pokemon'
import DataTable from '@/components/DataTable.vue'

const { pokemons, currentPage } = usePokemonTable()
const store = usePokemonStore()

// TypeScript otomatis tahu row.original adalah PokemonListItem
const columns: ColumnDef<PokemonListItem>[] = [
  { accessorKey: 'name', header: 'Nama' },
  {
    id: 'actions',
    cell: ({ row }) => {
      const pokemon = row.original;
      return h('button', {
        onClick: () => store.toggleFavorite(pokemon)
      }, store.isFavorite(pokemon.name) ? 'Hapus' : 'Favorit')
    }
  }
]
</script>

<template>
  <DataTable :data="pokemons" :columns="columns" />
  <button @click="currentPage--">Prev</button>
  <span>Page {{ currentPage }}</span>
  <button @click="currentPage++">Next</button>
</template>
```

---

## Key Learning Points
- **TanStack Router:** Memungkinkan navigasi yang *type-safe* dengan struktur file yang terorganisir.
- **Dynamic DataTable:** Menggunakan `<script generic="...">` agar satu komponen tabel bisa menampilkan data apapun tanpa kehilangan IntelliSense.
- **Prefetching & Caching:** Mengambil data halaman selanjutnya sebelum pengguna mengklik 'Next' memberikan pengalaman aplikasi yang instan.
- **Generic Inference:** Mendefinisikan tipe data pada array `columns` memberikan keamanan tipe data hingga ke dalam fungsi render `h()`.
