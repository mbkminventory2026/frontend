<script setup lang="ts">
import { getCoba } from '@/api/coba/coba';
import DataTable from '@/components/DataTable.vue';
import { useTable } from '@/composables/useTable';
import { pokemonSearchSchema } from '@/routes/_authenticated/pokemon';
import { type CobaListItem } from '@/schemas/coba/coba';
import { useSearch } from '@tanstack/vue-router';
import { ref, watch, onMounted } from 'vue';

const search = useSearch({ from:'/_authenticated/pokemon' });

const data = ref<CobaListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value.page ?? 1;
        const pageSize = search.value.pageSize ?? 20;
        const filter = search.value.filter ?? '';

        const response = await getCoba({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data:", error);
    } finally {
        isLoading.value = false;
    }
}

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Album ID', accessorKey: 'albumId' },
        { header: 'ID', accessorKey: 'id' },
        { header: 'Title', accessorKey: 'title' },
        { header: 'URL', accessorKey: 'url' },
        { header: 'Thumbnail URL', accessorKey: 'thumbnailUrl' },
    ],
    search: search,
    schema: pokemonSearchSchema,
})

onMounted(() => {
    fetchData();
});

watch(() => search, () => {
    fetchData();
}, { deep: true });

</script>
<template>
    <DataTable
        :table="table"
        :is-loading="isLoading"
        v-model:search="searchTerm"
        @search="onSearch"
        @clear-filter="clearFilter"
    />
</template>