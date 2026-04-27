export const ReportPengirimanKeys = ['createdAt', 'date', 'idReportPengiriman', 'idWoShellSize', 'quantity'] as const;
export type ReportPengirimanKey = (typeof ReportPengirimanKeys)[number];

export interface ReportPengirimanItem {
    createdAt: string;
    date: string;
    idReportPengiriman: number;
    idWoShellSize: number;
    quantity: number;
    // limit: number;
    // offset: number;
}

// export interface ReportPengirimanResponse {
//     info: {
//         total_count: number;
//         limit: number;
//         offset: number
//     };
//     results: ReportPengirimanItem[];
// }

export const ReportPengirimanLabels: Partial<Record<keyof ReportPengirimanItem, string>> = {
    createdAt: 'created_at',
    date: 'date',
    idReportPengiriman: 'id_report_pengiriman',
    idWoShellSize: 'id_wo_shell_size',
    quantity: 'quantity',
    // limit: 'limit',
    // offset: 'offset'
}