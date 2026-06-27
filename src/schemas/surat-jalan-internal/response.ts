export interface SuratJalanInternalListItem {
  id_surat_jalan_internal: number;
  no_dokumen: string;
  deskripsi: string;
  packing_list_count: number;
  created_at: string;
}

export interface SuratJalanInternalPackingListRow {
  id_packing_list: number;
  total_garment_per_box: number;
  total_reject: number;
  id_wo: number;
  created_at: string;
}

export interface SuratJalanInternalShellRow {
  no: number;
  deskripsi: string;
  color: string;
  qty: number;
  note: string;
}

export interface SuratJalanInternalDetailResponse {
  id_surat_jalan_internal: number;
  no_dokumen: string;
  deskripsi: string;
  created_at: string;
  packing_lists: SuratJalanInternalPackingListRow[];
  wo_shells: SuratJalanInternalShellRow[];
}

export interface SuratJalanInternalCreateResponse {
  id_surat_jalan_internal: number;
  no_dokumen: string;
  deskripsi: string;
  created_at: string;
}
