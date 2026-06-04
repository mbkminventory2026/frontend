export const WarnaRequestKeys = [
    'nama_warna',
    'kode_hex',
]

export type WarnaRequestKey = (typeof WarnaRequestKeys)[number]

export interface WarnaRequestItem {
    nama_warna: string,
    kode_hex?: string,
}

export const WarnaLabels: Partial<Record<keyof WarnaRequestItem, string>> = {
    nama_warna: 'nama_warna',
    kode_hex: 'kode_hex',
}
