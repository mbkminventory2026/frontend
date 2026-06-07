export const ProfilePerusahaanResponseKeys = [
    "about",
    "alamat",
    "created_at",
    "email",
    "id_profile_perusahaan",
    "logo",
    "nama",
    "no_telp"
] as const

export type ProfilePerusahaanResponseKey = (typeof ProfilePerusahaanResponseKeys)[number]

export interface ProfilePerusahaanResponseItem {
    about: string,
    alamat: string,
    created_at: string,
    email: string,
    id_profile_perusahaan: number,
    logo: string,
    nama: string,
    no_telp: string
}

export const ProfilePerusahaanLabels: Partial<Record<ProfilePerusahaanResponseKey, string>> = {
    about: 'About',
    alamat: 'Alamat',
    created_at: 'Created At',
    email: 'Email',
    id_profile_perusahaan: 'ID Profile Perusahaan',
    logo: 'Logo',
    nama: 'Nama',
    no_telp: 'No. Telp'
}
