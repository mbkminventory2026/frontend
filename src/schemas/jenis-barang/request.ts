export const JenisBarangRequestKeys = [
    'kode', 
    'nama_jenis_barang',     
]

export type JenisBarangRequestKey = (typeof JenisBarangRequestKeys)[number]

export interface JenisBarangRequestItem {
    kode: string,
    nama_jenis_barang: string,
}

export const JenisBarangLabels: Partial<Record<keyof JenisBarangRequestItem, string>> = {
    kode: 'Kode Jenis Barang',
    nama_jenis_barang: 'Nama Jenis Barang',
}
