export interface CreateRatioSizeSpreadingRequest {
  id_wo_shell_size: number;
  ratio_plan: number;
}

export interface CreateRatioSpreadingRequest {
  id_wo_shell: number;
  cons: number;
  plan_spreading_gelaran: number;
  panjang_marker: number;
  efficiency_marker: number;
  allowance: number;
  cons_buyer: number | null;
  roll_qty: number;
  sambungan_roll: number;
  reject: number;
  sizes: CreateRatioSizeSpreadingRequest[];
  plot?: number;
  lebar_kain?: number;
  panjang_marker_unit?: string;
  ket?: string;
}

export interface CreateKomponenSpreadingRequest {
  nama_komponen: string;
  ratios: CreateRatioSpreadingRequest[];
}

export interface CreateSpreadingCuttingPlanRequest {
  no_dokumen: string;
  tanggal_efektif: string;
  id_wo: number;
  components: CreateKomponenSpreadingRequest[];
}
