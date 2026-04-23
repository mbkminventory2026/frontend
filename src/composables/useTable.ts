import { useNavigate } from "@tanstack/vue-router";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { 
    useVueTable, 
    getCoreRowModel, 
    type ColumnDef, 
    type PaginationState, 
    type SortingState
} from "@tanstack/vue-table";
import { stripTableDefaults } from '@/lib/table-utils';
import { type ZodSchema } from "zod";
import { ref, watch } from 'vue';

interface UseTableOptions<TData, TSchema extends ZodSchema> {
    data: MaybeRefOrGetter<TData[]>;
    columns: ColumnDef<TData, any>[];
    rowCount: MaybeRefOrGetter<number>;
    search: any;
    schema: TSchema;
}

export function useTable<TData, TSchema extends ZodSchema>(
    options: UseTableOptions<TData, TSchema>
) {
    const navigate = useNavigate();

    // Data tervalidasi dari URL
    const safeSearch = computed(() => {
        try {
            return options.schema.parse(toValue(options.search));
        } catch {
            return options.schema.parse({});
        }
    });

    const searchTerm = ref(safeSearch.value.filter ?? '');

    watch(() => safeSearch.value.filter, (newFilter) => {
        searchTerm.value = newFilter ?? '';
    });

    const onSearch = () => {
        updateSearch({
            filter: searchTerm.value,
            page: 1
        });
    }

    const pagination = computed<PaginationState>(() => {
        const s = safeSearch.value;
        return {
            pageIndex: (s.page || 1) - 1,
            pageSize: s.pageSize || 20
        };
    });

    const sorting = computed<SortingState>(() => {
        const s = safeSearch.value;
        if (s.sortBy) {
            return [{ id: s.sortBy, desc: s.sortDesc ?? false }]
        }
        return [];
    })

    const updateSearch = (newParams: any) => {
        navigate({
            to: '.',
            search: (prev: any) => {
                const merged = { ...prev, ...newParams };
                const parsed = options.schema.parse(merged);
                return stripTableDefaults(parsed);
            },
        });
    };

    const clearFilter = () => {
        searchTerm.value = '';
        updateSearch({ filter: '', page: 1 });
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
            get globalFilter() { return safeSearch.value.filter },
        },
        onPaginationChange: (updater) => {
            const nextState = typeof updater === 'function' ? updater(pagination.value) : updater;
            updateSearch({ page: nextState.pageIndex + 1, pageSize: nextState.pageSize as any })
        },
        onSortingChange: (updater) => {
            const nexState = typeof updater === 'function' ? updater(sorting.value) : updater;
            const firstSort = nexState[0];
            updateSearch({ sortBy: firstSort?.id, sortDesc: firstSort?.desc ?? false, page: 1 })
        },
        onGlobalFilterChange: (updater) => {
            const nextValue = typeof updater === 'function'
                ? updater(safeSearch.value.filter)
                : updater;
            updateSearch({ filter: nextValue, page: 1 });
        }
    });

    return {
        table,
        searchTerm,
        onSearch,
        clearFilter,
        updateSearch,
        setPageSize: (size: number) => updateSearch({ pageSize: size, page: 1 }),
        setFilter: (val: string) => updateSearch({ filter: val, page: 1 }),
    }
}