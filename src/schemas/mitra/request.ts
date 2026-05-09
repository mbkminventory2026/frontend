export const MitraRequestKeys = [
    'nama_perusahaan',
    'tipe_perusahaan',
    'email',
    'no_telp',
    'kota',
    'kode_pos',
    'alamat'
]

export type MitraRequestKey = (typeof MitraRequestKeys)[number]

export interface MitraRequestItem {
    nama_perusahaan: string,
    tipe_perusahaan: string,
    email: string,
    no_telp: string,
    kota: string,
    kode_pos: string,
    alamat: string
}

export const MitraLabels: Partial<Record<keyof MitraRequestItem, string>> = {
    nama_perusahaan: 'Nama Perusahaan',
    tipe_perusahaan: 'Tipe Perusahaan',
    email: 'Email',
    no_telp: 'No. Telp',
    kota: 'Kota',
    kode_pos: 'Kode Pos',
    alamat: 'Alamat'
}
