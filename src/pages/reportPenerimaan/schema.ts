import { createTableParamsSchema } from '@/schemas/table-params';

export const reportPenerimaanColumns: [string, ...string[]] = [
    'created_at', 'tanggal', 'id_received', 'id_material_list_item', 'qty', 'keterangan'
];

export const reportPenerimaanSchema = createTableParamsSchema(reportPenerimaanColumns)
