export const SizeResponseKeys = [
    'created_at',
    'id_size',
    'nama_size',
]

export type SizeResponseKey = (typeof SizeResponseKeys)[number]

export interface SizeResponseItem {
    created_at: string,
    id_size: number,
    nama_size: string,
}

export const SizeLabels: Partial<Record<keyof SizeResponseItem, string>> = {
    created_at: 'created_at',
    id_size: 'id_size',
    nama_size: 'nama_size',
}
