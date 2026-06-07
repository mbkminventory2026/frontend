export const ProfilPerusahaanResponseKeys = [
    "about",
    "alamat",
    "created_at",
    "email",
    "id_profil_perusahaan",
    "logo",
    "nama",
    "no_telp"
] as const

export type ProfilPerusahaanResponseKey = (typeof ProfilPerusahaanResponseKeys)[number]

export interface ProfilPerusahaanResponseItem {
    about: string,
    alamat: string,
    created_at: string,
    email: string,
    id_profil_perusahaan: number,
    logo: string,
    nama: string,
    no_telp: string
}

export const ProfilPerusahaanLabels: Partial<Record<ProfilPerusahaanResponseKey, string>> = {
    about: 'About',
    alamat: 'Alamat',
    created_at: 'Created At',
    email: 'Email',
    id_profil_perusahaan: 'ID Profil Perusahaan',
    logo: 'Logo',
    nama: 'Nama',
    no_telp: 'No. Telp'
}
