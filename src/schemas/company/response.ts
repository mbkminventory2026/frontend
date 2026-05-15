export const CompanyResponseKeys = [
    "about",
    "alamat",
    "created_at",
    "email",
    "id_company",
    "logo",
    "nama",
    "no_telp"
]

export type CompanyResponseKey = (typeof CompanyResponseKeys)[number]

export interface CompanyResponseItem {
    about: string,
    alamat: string,
    created_at: string,
    email: string,
    id_company: number,
    logo: string,
    nama: string,
    no_telp: string
}

export const CompanyLabels: Partial<Record<CompanyResponseKey, string>> = {
    about: 'About',
    alamat: 'Alamat',
    created_at: 'Created At',
    email: 'Email',
    id_company: 'ID Company',
    logo: 'Logo',
    nama: 'Nama',
    no_telp: 'No. Telp'
}