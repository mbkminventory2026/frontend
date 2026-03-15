# 🚀 Panduan Pengembangan Fitur (Frontend)

Panduan ini berisi langkah-langkah standar untuk menambahkan fitur baru (misal: fitur Pokemon, User, atau Inventory) menggunakan setup yang sudah tersedia.

---

## 🛠 Flow Kerja (Step-by-Step)

Jika ingin membuat fitur baru, ikuti urutan ini:

### 1. Buat Schema (Definisi Data)
Tentukan seperti apa bentuk data yang akan diterima dari API.
*   **Lokasi:** `src/schemas/`
*   **Cara:** Buat file `.ts` dan definisikan interface-nya.
```typescript
// src/schemas/pokemon/pokemon.ts
export interface PokemonListItem {
    name: string;
    url: string;
}

export interface PokemonListResponse {
    count: number;
    results: PokemonListItem[];
}
```

### 2. Buat API Call
Daftarkan fungsi untuk mengambil data dari server.
*   **Lokasi:** `src/api/`
*   **Cara:** Gunakan `apiClient` yang sudah saya siapkan.
```typescript
// src/api/pokemon/pokemon.ts
import { apiClient } from "@/lib/apiClient";
import type { PokemonListResponse } from "@/schemas/pokemon/pokemon";

export const getPokemons = async (limit: number, offset: number) => {
    // apiClient sudah otomatis punya baseURL
    const response = await apiClient.get<PokemonListResponse>('/pokemon', {
        params: { limit, offset }
    });
    return response.data;
}
```

### 3. Daftarkan Route (Halaman)
Tentukan URL untuk halaman baru tersebut.
*   **Lokasi:** `src/routes/`
*   **Cara:** Buat file baru (misal: `pokemon.ts`) dan hubungkan ke file Page (Langkah 4).
```typescript
// src/routes/pokemon.ts
import { createRoute } from '@tanstack/vue-router';
import { route as rootRoute } from './__root';
import PokemonPage from '@/pages/PokemonListPage.vue'; // File UI

export const pokemonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pokemon', // URL di browser
  component: PokemonPage,
});
```
*Jangan lupa daftarkan rute baru ini di `src/routeTree.gen.ts` (jalankan `npm run dev` maka otomatis terdaftar).*

### 4. Buat Halaman & Visualisasi (Halaman Utama)
Di sinilah tempat Anda merangkai logika dan UI.

#### A. Menggunakan Logic (Composables)
Agar file Page rapi, simpan logika fetch di `src/composables/`.
```typescript
// Contoh pemakaian di Page
const { pokemons, isLoading, currentPage } = usePokemonTable();
```

#### B. Menggunakan Component Table (TanStack Table)
Saya sudah sediakan komponen `<DataTable />` yang siap pakai. Anda hanya perlu mendefinisikan **Kolom**-nya.

**Cara mendefinisikan kolom:**
```typescript
import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { Button } from '@/components/ui/button';

const columns: ColumnDef<PokemonListItem>[] = [
  {
    accessorKey: 'name', // Harus sama dengan key di Schema
    header: 'Nama Pokemon',
    cell: ({ row }) => h('div', { class: 'capitalize font-bold' }, row.getValue('name'))
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => {
      const data = row.original; // Ini adalah data asli satu baris (PokemonListItem)
      return h(Button, { 
        onClick: () => console.log('Klik', data.name) 
      }, () => 'Detail');
    }
  }
];
```

**Cara memasang di Template:**
```vue
<template>
  <DataTable 
    :data="pokemons" 
    :columns="columns" 
    :is-loading="isLoading" 
  />
</template>
```

---

## 📦 Library & Komponen Ready-to-Use

### 1. UI Components (`src/components/ui/`)
Kita menggunakan komponen berbasis Shadcn/Vue. Cara pakainya:
```typescript
import { Button } from '@/components/ui/button';
import { Table, TableBody, ... } from '@/components/ui/table';
```

### 2. State Management (Pinia)
Gunakan store jika ingin menyimpan data secara global (misal: User yang sedang login atau daftar favorit).
*   **Lokasi:** `src/store/`
```typescript
import { useAuthStore } from '@/store/authStore';
const auth = useAuthStore();
console.log(auth.user);
```

### 3. Helper Utility
Gunakan `cn()` untuk menggabungkan class Tailwind secara aman.
```typescript
import { cn } from '@/lib/utils';
// <div :class="cn('p-4', isActive && 'bg-blue-500')">
```

---

## 💡 Tips Cepat
- **Gak perlu buat table dari nol:** Gunakan `<DataTable />`. Cukup modifikasi `columns`.
- **Gak perlu pusing Axios:** Pakai `apiClient` dari `@/lib/apiClient`.
- **Gak perlu pusing Routing manual:** Cukup tambah file di `src/routes/` dan biarkan generator bekerja.
- **Type Safety:** Selalu gunakan `interface` dari `src/schemas/` agar muncul IntelliSense (auto-complete) saat ngoding.
