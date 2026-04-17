<script setup lang="ts" generic="TData, TValue">
import { useVueTable, getCoreRowModel, FlexRender, type Table as TableInstance } from '@tanstack/vue-table';
import type { ColumnDef } from '@tanstack/vue-table';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
 } from '@/components/ui/table';

const props = defineProps<{
    table: TableInstance<TData>,
    isLoading?: boolean,
}>();

</script>

<template>
    <div class="border rounded-md bg-white">
        <Table>
            <TableHeader>
                <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                    <TableHead v-for="header in headerGroup.headers" :key="header.id">
                        <FlexRender
                          v-if="!header.isPlaceholder"
                          :render="header.column.columnDef.header"
                          :props="header.getContext()"
                        />
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
                    <TableCell :colspan="table.getAllColumns.length" class="h-24 text-center text-slate-500">
                        Tidak ada data.
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </div>
</template>