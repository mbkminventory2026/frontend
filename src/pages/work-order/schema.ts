import { createTableParamsSchema } from '@/schemas/table-params';

export const workOrderColumns: [string, ...string[]] = [
    'created_at',
    'id_wo',
    'buyer',
    'model',
    'qty',
    'status',
    'po_number',
    'po_client_item_style'
];

export const workOrderSchema = createTableParamsSchema(workOrderColumns);
