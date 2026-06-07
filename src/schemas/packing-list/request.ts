export interface CreatePackingListItemSizeRequest {
  qty: number;
}

export interface CreatePackingListItemRequest {
  color: string;
  qty_box: number;
  qty_per_box: number;
  box_no_start: number;
  box_no_end: number;
  note?: string;
  sizes: CreatePackingListItemSizeRequest[];
}

export interface CreatePackingListRejectSizeRequest {
  qty: number;
}

export interface CreatePackingListRequest {
  total_garment_per_box: number;
  total_reject: number;
  id_wo: number;
  id_surat_jalan_internal?: number | null;
  items: CreatePackingListItemRequest[];
  reject_sizes: CreatePackingListRejectSizeRequest[];
}
