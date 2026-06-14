export const SizeRequestKeys = [
    'nama_size',
]

export type SizeRequestKey = (typeof SizeRequestKeys)[number]

export interface SizeRequestItem {
    nama_size: string,
}

export const SizeLabels: Partial<Record<keyof SizeRequestItem, string>> = {
    nama_size: 'nama_size',
}
