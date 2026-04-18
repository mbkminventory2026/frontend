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
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-vue-next';

const props = defineProps<{
    table: TableInstance<TData>,
    isLoading?: boolean,
}>();

</script>

<template>
    <div class="p-4">
        <div class="flex gap-2 mb-4 justify-end">
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
        <div class="border rounded-md bg-white">
            <Table>
                <TableHeader>
                    <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                        <TableHead v-for="header in headerGroup.headers" :key="header.id" class="font-bold" :class="{
                            'cursor-pointer select-none hover:bg-slate-50 transition-colors': header.column.getCanSort()
                        }"
                        @click="header.column.getToggleSortingHandler()?.($event)"
                        >
                            <div class="flex items-center gap-2">
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