import { useNavigate } from "@tanstack/vue-router";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { 
    useVueTable, 
    getCoreRowModel, 
    type ColumnDef, 
    type PaginationState, 
    type SortingState
} from "@tanstack/vue-table";
import { type TableParams } from "@/schemas/table-params";

interface UseTableOptions<TData> {
    data: MaybeRefOrGetter<TData[]>;
    columns: ColumnDef<TData, any>[];
    rowCount: MaybeRefOrGetter<number>;
    search: TableParams;
}

export function useTable<TData>(
    options: UseTableOptions<TData>
) {
    const navigate = useNavigate();

    const pagination = computed<PaginationState>(() => {
        const currentSearch = toValue(options.search);
        return {
            pageIndex: (currentSearch.page || 1) - 1,
            pageSize: currentSearch.pageSize || 20
        };
    });

    const sorting = computed<SortingState>(() => {
        const currentSearch = toValue(options.search);

        if (currentSearch.sortBy) {
            return [{
                id: currentSearch.sortBy,
                desc: currentSearch.sortDesc ?? false
            }]
        }
        return [];  // default
    })

    const updateSearch = (newParams: Partial<TableParams>) => {
        navigate({
            to: '.',
            search: (prev: any) => ({
                ...prev,
                ...newParams,
            }),
        });
    };

    const table = useVueTable({
        get data() { return toValue(options.data) },
        get columns() { return options.columns },

        getCoreRowModel: getCoreRowModel(),
        get rowCount() { return toValue(options.rowCount) },

        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,

        state: {
            get pagination() { return pagination.value },
            get sorting() { return sorting.value },
        },

        onPaginationChange: (updater) => {
            const nextState = typeof updater === 'function'
            ? updater(pagination.value)
            : updater;
            
            updateSearch({
                page: nextState.pageIndex + 1,
                pageSize: nextState.pageSize as TableParams['pageSize']
            })
        },

        onSortingChange: (updater) => {
            const nexState = typeof updater === 'function'
            ? updater(sorting.value)
            : updater;

            const firstSort = nexState[0];

            updateSearch({
                sortBy: firstSort?.id,
                sortDesc: firstSort?.desc ?? false,
                page: 1
            })
        }
    });

    const setPageSize = (size: TableParams['pageSize']) => {
        updateSearch({ pageSize: size, page: 1 }) // reset ke page 1 jika size berubah
    };

    const setFilter = (val: string) => {
        updateSearch({ filter: val, page: 1 })
    };

    return {
        table,
        setPageSize,
        setFilter,
    }
}