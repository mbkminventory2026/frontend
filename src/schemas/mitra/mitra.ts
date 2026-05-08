export const MitraKeys = [
    'created_at',
    'email', 
    'id_mitra',
    'nama_perusahaan',
    'no_telp', 
    'tipe_perusahaan',
    'alamat',
    'kota',
    'kode_pos'
]

export type MitraKey = (typeof MitraKeys)[number]

export interface MitraItem {
    created_at: string,
    email: string,
    id_mitra: number,
    nama_perusahaan: string,
    tipe_perusahaan: string,
    no_telp: string,
    alamat: string,
    kota: string,
    kode_pos: string
}

export const MitraLabels: Partial<Record<keyof MitraItem, string>> = {
    created_at: 'created_at',
    email: 'email', 
    id_mitra: 'id_mitra',
    nama_perusahaan: 'nama_perusahaan',
    no_telp: 'no_telp', 
    tipe_perusahaan: 'tipe_perusahaan',
    alamat: 'alamat',
    kota: 'kota',
    kode_pos: 'kode_pos'
}