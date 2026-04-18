<script setup lang="ts">
import { getCoba } from '@/api/coba/coba';
import { getPokemons } from '@/api/pokemon/pokemon';
import DataTable from '@/components/DataTable.vue';
import { useTable } from '@/composables/useTable';
import { albumSearchSchema } from '@/routes/pokemon';
import { type CobaListItem } from '@/schemas/coba/coba';
import type { PokemonListItem } from '@/schemas/pokemon/pokemon';
import { useSearch } from '@tanstack/vue-router';
import { ref, watch, onMounted } from 'vue';

const search = useSearch({ from:'/pokemon' });

const data = ref<CobaListItem[]>([]);
// const data = ref<CobaListResponse[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await getCoba({
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

const { table, updateSearch } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        // { header: 'Nama Pokemon', accessorKey: 'name' },
        // { header: 'URL', accessorKey: 'url' },

        // { header: 'ID', accessorKey: 'id' },
        // { header: 'User ID', accessorKey: 'userId' },
        // { header: 'Title', accessorKey: 'title' },
        // { header: 'Body', accessorKey: 'body' },

        { header: 'Album ID', accessorKey: 'albumId' },
        { header: 'ID', accessorKey: 'id' },
        { header: 'Title', accessorKey: 'title' },
        { header: 'URL', accessorKey: 'url' },
        { header: 'Thumbanil URL', accessorKey: 'thumbnailUrl' },
    ],
    search: search,
    schema: albumSearchSchema,
})

onMounted(() => {
    const parsed = albumSearchSchema.safeParse(search.value);
    if (parsed.success && JSON.stringify(parsed.data) !== JSON.stringify(search.value)) {
        updateSearch({});
    }
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
    />
</template>