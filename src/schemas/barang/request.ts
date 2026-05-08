export const BarangRequestKeys = [
    'id_jenis_barang',
    'id_mitra',
    'kode', 
    'nama_barang',     
]

export type BarangRequestKey = (typeof BarangRequestKeys)[number]

export interface BarangRequestItem {
    id_jenis_barang: string,
    id_mitra: number,
    kode: string,
    nama_barang: string,
}

export const BarangLabels: Partial<Record<keyof BarangRequestItem, string>> = {
    id_jenis_barang: 'id_jenis_barang',
    id_mitra: 'id_mitra',
    kode: 'kode',
    nama_barang: 'nama_barang',
}