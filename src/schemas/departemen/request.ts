export const DepartemenRequestKeys = [
    'nama_departemen',     
]

export type DepartemenRequestKey = (typeof DepartemenRequestKeys)[number]

export interface DepartemenRequestItem {
    nama_departemen: string,
}

export const DepartemenLabels: Partial<Record<keyof DepartemenRequestItem, string>> = {
    nama_departemen: 'Nama Departemen',
}
