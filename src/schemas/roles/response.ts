export const RolesResponseKeys = [
    'created_at',
    'id_role',
    'nama_role'
]

export type RolesResponseKey = (typeof RolesResponseKeys)[number]

export interface RolesResponseItem {
    created_at: string,
    id_role: number,
    nama_role: string,
    permissions?: string[],
    hak_akses_ids?: number[]
}

export const RolesResponseLabels: Partial<Record<keyof RolesResponseItem, string>> = {
    created_at: 'Created At',
    id_role: 'ID Role',
    nama_role: 'Nama Role'
}
