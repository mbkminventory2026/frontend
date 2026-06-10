export const ReportPenerimaanKeys = ['createdAt', 'tanggal', 'idReceived', 'idMaterialListItem', 'qty', 'keterangan'] as const;
export type ReportPenerimaanKey = (typeof ReportPenerimaanKeys)[number];

export interface ReportPenerimaanItem {
    createdAt: string;
    tanggal: string;
    idReceived: number;
    idMaterialListItem: number;
    qty: number;
    keterangan: string;
}

export const ReportPenerimaanLabels: Partial<Record<keyof ReportPenerimaanItem, string>> = {
    createdAt: 'created_at',
    tanggal: 'tanggal',
    idReceived: 'id_received',
    idMaterialListItem: 'id_material_list_item',
    qty: 'qty',
    keterangan: 'keterangan',
}
