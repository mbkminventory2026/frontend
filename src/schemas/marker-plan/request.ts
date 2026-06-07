export interface CreateRatioSizeMarkerRequest {
  id_wo_shell_size: number;
  qty_plan: number;
}

export interface CreateRatioMarkerRequest {
  id_wo_shell: number;
  cons: number;
  plan_spreading_gelaran: number;
  panjang_marker: number;
  efficiency_marker: number;
  allowance: number;
  cons_buyer: number | null;
  roll_qty: number;
  sambungan_roll: number;
  sizes: CreateRatioSizeMarkerRequest[];
  plot?: number;
  lebar_kain?: number;
  panjang_marker_unit?: string;
  ket?: string;
}

export interface CreateKomponenMarkerPlanRequest {
  nama_komponen: string;
  ratios: CreateRatioMarkerRequest[];
}

export interface CreateMarkerPlanRequest {
  no_dokumen: string;
  tanggal_efektif: string;
  id_wo_shell: number;
  components: CreateKomponenMarkerPlanRequest[];
}
