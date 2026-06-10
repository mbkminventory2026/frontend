export interface RatioSizeSpreadingResponse {
  id_ratio_size_spreading: number;
  id_ratio_spreading: number;
  id_wo_shell_size: number;
  ratio_plan: number;
  size?: string;
  size_qty?: number;
}

export interface RatioSpreadingResponse {
  id_ratio_spreading: number;
  id_komponen_spreading: number;
  id_wo_shell: number;
  cons: number;
  plan_spreading_gelaran: number;
  allowance: number;
  roll_qty: number;
  sambungan_roll: number;
  reject: number;
  lebar_kain: number;
  ket: string;
  created_at: string;
  sizes: RatioSizeSpreadingResponse[];
}

export interface KomponenSpreadingResponse {
  id_komponen_spreading: number;
  id_spreading_cutting_plan: number;
  nama_komponen: string;
  created_at: string;
  ratios: RatioSpreadingResponse[];
}

export interface SpreadingCuttingPlanResponse {
  id_spreading_cutting_plan: number;
  no_dokumen: string;
  tanggal_efektif: string;
  id_wo: number;
  style: string;
  model: string;
  buyer: string;
  created_at: string;
  components: KomponenSpreadingResponse[];
}
