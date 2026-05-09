export const JenisBarangResponseKeys = [
    'created_at',
    'id_jenis_barang',
    'kode', 
    'nama_jenis_barang'
]

export type JenisBarangResponseKey = (typeof JenisBarangResponseKeys)[number]

export interface JenisBarangResponseItem {
    created_at: string,
    id_jenis_barang: number,
    kode: string,
    nama_jenis_barang: string
}

export const JenisBarangLabels: Partial<Record<keyof JenisBarangResponseItem, string>> = {
    created_at: 'Created At',
    id_jenis_barang: 'ID Jenis Barang',
    kode: 'Kode Jenis Barang',
    nama_jenis_barang: 'Nama Jenis Barang'
}
