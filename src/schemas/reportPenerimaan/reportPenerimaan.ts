export const ReportPenerimaanKeys = ['createdAt', 'tanggal', 'idReceived', 'idMaterialList', 'qty', 'keterangan'] as const;
export type ReportPenerimaanKey = (typeof ReportPenerimaanKeys)[number];

export interface ReportPenerimaanItem {
    createdAt: string;
    tanggal: string;
    idReceived: number;
    idMaterialList: number;
    qty: number;
    keterangan: string;
}

export const ReportPenerimaanLabels: Partial<Record<keyof ReportPenerimaanItem, string>> = {
    createdAt: 'created_at',
    tanggal: 'tanggal',
    idReceived: 'id_received',
    idMaterialList: 'id_material_list',
    qty: 'qty',
    keterangan: 'keterangan',
}
