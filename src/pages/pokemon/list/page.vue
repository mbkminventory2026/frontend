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

const { table } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Nama Pokemon', accessorKey: 'name' },
        { header: 'URL', accessorKey: 'url' }
    ],
    search: search
})

</script>
<template>
    <DataTable
        :table="table"
        :is-loading="isLoading"
    />
</template>