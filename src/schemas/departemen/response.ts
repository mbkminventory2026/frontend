export const DepartemenResponseKeys = [
    'created_at',
    'id_departemen',
    'nama_departemen'
]

export type DepartemenResponseKey = (typeof DepartemenResponseKeys)[number]

export interface DepartemenResponseItem {
    created_at: string,
    id_departemen: number,
    nama_departemen: string
}

export const DepartemenLabels: Partial<Record<keyof DepartemenResponseItem, string>> = {
    created_at: 'Created At',
    id_departemen: 'ID Departemen',
    nama_departemen: 'Nama Departemen'
}
