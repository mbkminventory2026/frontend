export const ProfilPerusahaanResponseKeys = [
    "about",
    "alamat",
    "created_at",
    "email",
    "id_profil_perusahaan",
    "logo",
    "nama",
    "no_telp",
    "background_login",
    "text_footer",
    "link_website",
    "medsos"
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
    no_telp: string,
    background_login: string,
    text_footer: string,
    link_website: string,
    medsos: string
}

export const ProfilPerusahaanLabels: Partial<Record<ProfilPerusahaanResponseKey, string>> = {
    about: 'About',
    alamat: 'Alamat',
    created_at: 'Created At',
    email: 'Email',
    id_profil_perusahaan: 'ID Profil Perusahaan',
    logo: 'Logo',
    nama: 'Nama',
    no_telp: 'No. Telp',
    background_login: 'Background Login',
    text_footer: 'Text Footer',
    link_website: 'Link Website',
    medsos: 'Media Sosial'
}
