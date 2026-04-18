import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { redirect } from '@tanstack/vue-router'
import { tableParamKeys } from '@/schemas/table-params'

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

export function validateTableSearchRedirect(
    to: string,
    raw: Record<string, any>,
    parsed: Record<string, any>
) {
    const hasExtraKeys = Object.keys(raw).some(
        (key) => !tableParamKeys.includes(key as any)
    )

    const hasChangedValues = 
    String(raw.page ?? '') !== String(parsed.page ?? '') ||
    (raw.filter ?? '') !== (parsed.filter ?? '') ||
    (raw.sortBy !== undefined && raw.sortBy !== parsed.sortBy) ||
    (raw.pageSize !== undefined && String(raw.pageSize) !== String(parsed.pageSize)) ||
    (raw.sortDesc !== undefined && String(raw.sortDesc) !== String(parsed.sortDesc))

    if (hasExtraKeys || hasChangedValues) {
        throw redirect({
            to,
            search: parsed,
            replace: true,
        })
    }
}