export const MitraResponseKeys = [
    'created_at',
    'id_mitra',
    'nama_perusahaan',
    'email',
    'no_telp',
    'tipe_perusahaan',
    'alamat',
    'kota',
    'kode_pos'
]

export type MitraResponseKey = (typeof MitraResponseKeys)[number]

export interface MitraResponseItem {
    created_at: string,
    id_mitra: number,
    nama_perusahaan: string,
    email: string,
    no_telp: string,
    tipe_perusahaan: string,
    alamat: string,
    kota: string,
    kode_pos: string
}

export const MitraLabels: Partial<Record<keyof MitraResponseItem, string>> = {
    created_at: 'Created At',
    id_mitra: 'ID Mitra',
    nama_perusahaan: 'Nama Perusahaan',
    email: 'Email',
    no_telp: 'No. Telp',
    tipe_perusahaan: 'Tipe Perusahaan',
    alamat: 'Alamat',
    kota: 'Kota',
    kode_pos: 'Kode Pos'
}
