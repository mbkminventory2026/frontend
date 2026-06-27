export interface CreateSuratJalanInternalRequest {
  no_dokumen: string;
  deskripsi?: string;
  id_packing_lists?: number[];
}

export interface AssignPackingListRequest {
  id_packing_list: number;
}
