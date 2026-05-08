export const BarangResponseKeys = [
    'created_at',
    'id_barang',
    'kode', 
    'nama_barang', 
    'nama_jenis_barang', 
    'nama_perusahaan'
]

export type BarangResponseKey = (typeof BarangResponseKeys)[number]

export interface BarangResponseItem {
    created_at: string,
    id_barang: number,
    kode: string,
    nama_barang: string,
    nama_jenis_barang: string,
    nama_perusahaan: string
}

export const BarangLabels: Partial<Record<keyof BarangResponseItem, string>> = {
    created_at: 'created_at',
    id_barang: 'id_barang',
    kode: 'kode',
    nama_barang: 'nama_barang',
    nama_jenis_barang: 'nama_jenis_barang',
    nama_perusahaan: 'nama_perusahaan'
}