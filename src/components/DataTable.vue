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
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-vue-next';
import Label from './ui/label/Label.vue';
import Input from './ui/input/Input.vue';
import SkeletonComponent from './Skeleton.vue';

const props = defineProps<{
    table: TableInstance<TData>,
    isLoading?: boolean,
}>();

const searchModel = defineModel<string>('search');
const emit = defineEmits(['search', 'clearFilter']);
</script>

<template>
    <div class="flex flex-col p-4">
        <div class="flex flex-col gap-4 mb-4">
            <div class="flex items-center justify-between gap-4">
                <div class="flex gap-4">
                    <div class="flex items-center justify-start gap-2">
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
                </div>

                <div class="flex items-center gap-2">
                    <slot name="actions" />
                </div>
            </div>

        </div>
        <div class="bg-white border rounded-md overflow-hidden">
            <Table>
                <TableHeader class="sticky top-0 z-10 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
                    <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="hover:bg-transparent border-b-0">
                        <TableHead v-for="header in headerGroup.headers" :key="header.id" class="font-bold text-sidebar-foreground hover:text-sidebar-accent-foreground" :class="{
                            'cursor-pointer select-none transition-colors': header.column.getCanSort()
                        }"
                        @click="header.column.getToggleSortingHandler()?.($event)"
                        >
                            <div class="flex items-center justify-center gap-2">
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
                    <template v-if="isLoading">
                        <TableRow v-for="rowIndex in 20" :key="'skeleton-row-' + rowIndex">
                            <TableCell v-for="column in table.getAllColumns()" :key="'skeleton-cell-' + column.id" class="p-4">
                                <SkeletonComponent type="table-cell" />
                            </TableCell>
                        </TableRow>
                    </template>

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
            <div class="flex gap-2 mt-4">
                <Button 
                    :disabled="!table.getCanPreviousPage()"
                    @click="table.previousPage()"
                >Back
                </Button>
            </div>
            <div class="flex gap-2 mt-4">
                <Button 
                    :disabled="!table.getCanNextPage()"
                    @click="table.nextPage()"
                >Next
                </Button>
            </div>
        </div>
    </div>
</template>