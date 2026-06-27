export interface SuratJalanInternalItemRequest {
  no: number;
  deskripsi: string;
  qty: number;
  note: string;
}

export interface CreateSuratJalanInternalRequest {
  id_wo: number;
  no_dokumen: string;
  deskripsi?: string;
  items: SuratJalanInternalItemRequest[];
  id_packing_lists?: number[];
}

export interface AssignPackingListRequest {
  id_packing_list: number;
}
