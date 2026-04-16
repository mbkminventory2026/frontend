import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'

export function createColumns<T>(
    keys: (keyof T)[],
    labels?: Partial<Record<keyof T, string>>
): ColumnDef<T, any>[] {
    return keys.map((key) => ({
        accessorKey: key as string,
        header: labels?.[key] || (key as string).charAt(0).toUpperCase() + (key as string).slice(1),
        cell: ({ row }) => h('div', { class: 'py-1' }, row.getValue(key as string))
    })
    )
}