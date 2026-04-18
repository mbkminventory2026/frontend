<script setup lang="ts">
import { getCoba } from '@/api/coba/coba';
import DataTable from '@/components/DataTable.vue';
import { useTable } from '@/composables/useTable';
import { pokemonSearchSchema } from '@/routes/pokemon';
import { type CobaListItem } from '@/schemas/coba/coba';
import { useSearch } from '@tanstack/vue-router';
import { ref, watch, onMounted } from 'vue';

const search = useSearch({ from:'/pokemon' });

const data = ref<CobaListItem[]>([]);
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
        console.error("Gagal fetch data:", error);
    } finally {
        isLoading.value = false;
    }
}

const { table } = useTable({
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
    />
</template>