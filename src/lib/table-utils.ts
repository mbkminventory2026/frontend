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

/**
 * Strip default/empty values from parsed table params so they don't appear in the URL.
 * Only non-default values are kept in the search object.
 */
export function stripTableDefaults(parsed: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    if (parsed.page !== undefined && parsed.page !== 1) cleaned.page = parsed.page;
    if (parsed.filter !== undefined && parsed.filter !== '') cleaned.filter = parsed.filter;
    if (parsed.sortBy !== undefined) cleaned.sortBy = parsed.sortBy;
    if (parsed.sortDesc === true) cleaned.sortDesc = parsed.sortDesc;
    if (parsed.pageSize !== undefined && parsed.pageSize !== 20) cleaned.pageSize = parsed.pageSize;
    return cleaned;
}

export function validateTableSearchRedirect(
    to: string,
    raw: Record<string, any>,
    parsed: Record<string, any>
) {
    const hasExtraKeys = Object.keys(raw).some(
        (key) => !tableParamKeys.includes(key as any)
    )

    // Compare raw vs parsed (both may be sparse/stripped)
    const rawKeys = Object.keys(raw);
    const parsedKeys = Object.keys(parsed);
    
    const hasChangedValues = rawKeys.length !== parsedKeys.length ||
        rawKeys.some(key => String(raw[key] ?? '') !== String(parsed[key] ?? ''))

    if (hasExtraKeys || hasChangedValues) {
        throw redirect({
            to,
            search: parsed,
            replace: true,
        })
    }
}