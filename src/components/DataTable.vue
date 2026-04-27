<script setup lang="ts" generic="TData">
import { FlexRender, type Table as TableInstance } from '@tanstack/vue-table';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
 } from '@/components/ui/table';
import Button from './ui/button/Button.vue';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select/';
import { ArrowUp, ArrowDown, ArrowUpDown, Search, X } from 'lucide-vue-next';
import Label from './ui/label/Label.vue';
import Input from './ui/input/Input.vue';
import { computed } from 'vue';

const props = defineProps<{
    table: TableInstance<TData>,
    isLoading?: boolean,
}>();

const searchModel = defineModel<string>('search');
const emit = defineEmits(['search', 'clearFilter']);

const activeFilter = computed(() => {
    return props.table.getState().globalFilter as string | undefined;
});
</script>

<template>
    <div class="p-4 flex flex-col">
        <div class="flex flex-col gap-4 mb-4">
            <div class="flex gap-4 justify-start items-center">
                <div class="flex gap-2 justify-start items-center">
                    <Label>Show:</Label>
                    <Select
                        :model-value="String(table.getState().pagination.pageSize)"
                        @update:model-value="(val) => table.setPageSize(Number(val))"
                    >
                        <SelectTrigger>
                            <SelectValue :placeholder="String(table.getState().pagination.pageSize)"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div class="flex gap-1">
                    <div class="flex gap-2">
                        <Input
                            v-model="searchModel"
                            type="text" 
                            placeholder="Search"
                            @keyup.enter="emit('search')"
                        />
                        <Button type="button" @click="emit('search')">
                            <Search/>
                        </Button>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <slot name="actions" />
                </div>
            </div>
            <div v-if="activeFilter" class="flex items-center gap-1.5 mt-1">
                <span class="text-xs text-slate-500">Hasil pencarian:</span>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-300 text-xs font-medium italic">
                    "{{ activeFilter }}"
                    <button
                        type="button"
                        class="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                        @click="emit('clearFilter')"
                        title="Hapus filter"
                    >
                        <X class="w-3 h-3" />
                    </button>
                </span>
            </div>
        </div>
        <div class="border rounded-md bg-white">
            <Table>
                <TableHeader>
                    <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                        <TableHead v-for="header in headerGroup.headers" :key="header.id" class="font-bold" :class="{
                            'cursor-pointer select-none hover:bg-slate-50 transition-colors': header.column.getCanSort()
                        }"
                        @click="header.column.getToggleSortingHandler()?.($event)"
                        >
                            <div class="flex items-center gap-2 justify-center">
                                <FlexRender
                                    v-if="!header.isPlaceholder"
                                    :render="header.column.columnDef.header"
                                    :props="header.getContext()"
                                />
                                <template v-if="header.column.getCanSort() && !header.isPlaceholder">
                                    <ArrowUp v-if="header.column.getIsSorted() === 'asc'" class="w-4 h-4"/>
                                    <ArrowDown v-else-if="header.column.getIsSorted() === 'desc'" class="w-4 h-4"/>
                                    <ArrowUpDown v-else class="w-4 h-4 opacity-30"/>
                                </template>
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <TableRow v-if="isLoading">
                        <TableCell :colspan="table.getAllColumns().length" class="h-24 text-center text-slate-500">
                            Sedang mengambil data...
                        </TableCell>
                    </TableRow>

                    <template v-else-if="table.getRowModel().rows?.length">
                        <TableRow 
                        v-for="row in table.getRowModel().rows" 
                        :key="row.id"
                        :data-state="row.getIsSelected() && 'selected'"
                        class="text-center"
                        >
                            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                <FlexRender 
                                :render="cell.column.columnDef.cell" 
                                :props="cell.getContext()"
                                />
                            </TableCell>
                        </TableRow>
                    </template>

                    <TableRow v-else>
                        <TableCell :colspan="table.getAllColumns().length" class="h-24 text-center text-slate-500">
                            Tidak ada data.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        <div class="flex gap-2">
            <div class="mt-4 flex gap-2">
                <Button 
                    :disabled="!table.getCanPreviousPage()"
                    @click="table.previousPage()"
                >Back
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button 
                    :disabled="!table.getCanNextPage()"
                    @click="table.nextPage()"
                >Next
                </Button>
            </div>
        </div>
    </div>
</template>