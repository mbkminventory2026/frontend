export const PermissionsResponseKeys = [
    'created_at',
    'id_hak_akses',
    'nama_halaman',
    'kode_permission',
    'deskripsi',
    'domain_permission',
    'aksi_permission'
]

export type PermissionsResponseKey = (typeof PermissionsResponseKeys)[number]

export interface PermissionsResponseItem {
    created_at: string,
    id_hak_akses: number,
    nama_halaman: string,
    kode_permission: string,
    deskripsi: string,
    domain_permission: string,
    aksi_permission: string
}

export const PermissionsResponseLabels: Partial<Record<keyof PermissionsResponseItem, string>> = {
    created_at: 'Created At',
    id_hak_akses: 'ID Hak Akses',
    nama_halaman: 'Nama Halaman',
    kode_permission: 'Kode Permission',
    deskripsi: 'Deskripsi',
    domain_permission: 'Domain',
    aksi_permission: 'Aksi'
}
