export const PermissionsResponseKeys = [
    'created_at',
    'id_hak_akses',
    'nama_halaman'
]

export type PermissionsResponseKey = (typeof PermissionsResponseKeys)[number]

export interface PermissionsResponseItem {
    created_at: string,
    id_hak_akses: number,
    nama_halaman: string
}

export const PermissionsResponseLabels: Partial<Record<keyof PermissionsResponseItem, string>> = {
    created_at: 'Created At',
    id_hak_akses: 'ID Hak Akses',
    nama_halaman: 'Nama Halaman'
}
