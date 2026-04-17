import { useNavigate } from "@tanstack/vue-router";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { 
    useVueTable, 
    getCoreRowModel, 
    type ColumnDef, 
    type PaginationState, 
} from "@tanstack/vue-table";

interface UseTableOptions<TData> {
    data: MaybeRefOrGetter<TData[]>;
    columns: ColumnDef<TData, any>[];
    rowCount: MaybeRefOrGetter<number>;
    search: any;
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
    })

    const updateSearch = (newParams: Partial<any>) => {
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
        },

        onPaginationChange: (updater) => {
            const nextState = typeof updater === 'function'
            ? updater(pagination.value)
            : updater;
            navigate({
                to: '.',
                search: (prev: any) => ({
                    ...prev,
                    page: nextState.pageIndex + 1,
                    pageSize: nextState.pageSize
                })
            });
        },

        // onSortingChange:
    });

    const setPageSize = (size: number) => {
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