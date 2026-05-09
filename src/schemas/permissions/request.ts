export const PermissionsRequestKeys = [
    'nama_halaman',     
]

export type PermissionsRequestKey = (typeof PermissionsRequestKeys)[number]

export interface PermissionsRequestItem {
    nama_halaman: string,
}

export const PermissionsLabels: Partial<Record<keyof PermissionsRequestItem, string>> = {
    nama_halaman: 'Nama Halaman',
}
