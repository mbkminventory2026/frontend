export interface PackingListItemSizeResponse {
  id_packing_list_item_size: number;
  id_wo_shell_size: number;
  qty: number;
  created_at: string;
}

export interface PackingListItemResponse {
  id_packing_list_item: number;
  color: string;
  qty_box: number;
  qty_per_box: number;
  box_no_start: number;
  box_no_end: number;
  note?: string;
  created_at: string;
  sizes: PackingListItemSizeResponse[];
}

export interface PackingListRejectSizeResponse {
  id_packing_list_reject_size: number;
  id_wo_shell_size: number;
  qty: number;
  created_at: string;
}

export interface PackingListResponse {
  id_packing_list: number;
  total_garment_per_box: number;
  total_reject: number;
  id_wo: number;
  id_surat_jalan_internal?: number | null;
  buyer: string;
  model: string;
  created_at: string;
  items: PackingListItemResponse[];
  reject_sizes: PackingListRejectSizeResponse[];
}

export interface PackingListListItem {
  id_packing_list: number;
  total_garment_per_box: number;
  total_reject: number;
  id_wo: number;
  id_surat_jalan_internal?: number | null;
  buyer: string;
  model: string;
  created_at: string;
}
