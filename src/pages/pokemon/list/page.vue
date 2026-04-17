<script setup lang="ts">
import { getPokemons } from '@/api/pokemon/pokemon';
import DataTable from '@/components/DataTable.vue';
import { useTable } from '@/composables/useTable';
import type { PokemonListItem } from '@/schemas/pokemon/pokemon';
import { useSearch } from '@tanstack/vue-router';
import { ref, watch, onMounted } from 'vue';

const search = useSearch({ from:'/pokemon' });

const data = ref<PokemonListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await getPokemons({
            limit: search.value.pageSize,
            offset: (search.value.page - 1) * search.value.pageSize,
            search: search.value.filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch pokemon:", error);
    } finally {
        isLoading.value = false;
    }
}

onMounted(() => {
    fetchData();
});

watch(() => search, () => {
    fetchData();
}, { deep: true });

const { table, setPageSize } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Nama Pokemon', accessorKey: 'name' },
        { header: 'url', accessorKey: 'url' }
    ],
    search: search
})

</script>
<template>
    <div class="p-4">
        <div class="flex gap-2 mb-4">
            <select @change="(e) => setPageSize(Number((e.target as HTMLSelectElement).value))">
                <option :selected="search.pageSize === 20" value="20">20</option>
                <option :selected="search.pageSize === 50" value="50">50</option>
                <option :selected="search.pageSize === 100" value="100">100</option>
            </select>
            <span v-if="isLoading">Memuat data...</span>
        </div>

        <DataTable
            :table="table"
            :is-loading="isLoading"
        />

        <div class="flex gap-2">
            <div class="mt-4 flex gap-2">
                <button 
                    :disabled="!table.getCanNextPage()"
                    @click="table.previousPage()"
                >Back
                </button>
            </div>
            <div class="mt-4 flex gap-2">
                <button 
                    :disabled="!table.getCanNextPage()"
                    @click="table.nextPage()"
                >Next
                </button>
            </div>
        </div>
    </div>
</template>