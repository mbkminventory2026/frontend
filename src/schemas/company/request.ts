export const CompanyRequestKeys = [
    'about',
    'alamat',
    'email',
    'logo',
    'nama',
    'no_telp'
]

export type CompanyRequestKey = (typeof CompanyRequestKeys)[number]

export interface CompanyRequestItem {
    about: string;
    alamat: string;
    email: string;
    logo: string;
    nama: string;
    no_telp: string;
}

export const CompanyLabels: Partial<Record<CompanyRequestKey, string>> = {
    about: 'About',
    alamat: 'Alamat',
    email: 'Email',
    logo: 'Logo',
    nama: 'Nama',
    no_telp: 'No. Telp'
}