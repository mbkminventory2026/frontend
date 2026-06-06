import { createTableParamsSchema } from '@/schemas/table-params';

export const reportPengirimanColumns: [string, ...string[]] = [
    'created_at', 'date', 'id_report_pengiriman', 'id_wo_shell_size', 'quantity'
];

export const reportPengirimanSchema = createTableParamsSchema(reportPengirimanColumns)
