export const WarnaResponseKeys = [
    'created_at',
    'id_warna',
    'nama_warna', 
    'kode_hex', 
]

export type WarnaResponseKey = (typeof WarnaResponseKeys)[number]

export interface WarnaResponseItem {
    created_at: string,
    id_warna: number,
    nama_warna: string,
    kode_hex?: string
}

export const WarnaLabels: Partial<Record<keyof WarnaResponseItem, string>> = {
    created_at: 'created_at',
    id_warna: 'id_warna',
    nama_warna: 'nama_warna',
    kode_hex: 'kode_hex'
}
