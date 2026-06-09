export interface RatioSizeMarkerResponse {
  id_ratio_size_marker: number;
  id_ratio_marker: number;
  id_wo_shell_size: number;
  ratio_plan: number;
  size?: string;
}

export interface RatioMarkerResponse {
  id_ratio_marker: number;
  id_komponen_marker: number;
  id_wo_shell: number;
  qty_fabric_received: number;
  cons: number;
  plan_spreading_gelaran: number;
  panjang_marker: number;
  efficiency_marker: number;
  allowance: number;
  cons_buyer?: number | null;
  plot: number;
  lebar_kain: number;
  panjang_marker_unit: string;
  ket: string;
  created_at: string;
  sizes: RatioSizeMarkerResponse[];
}

export interface KomponenMarkerPlanResponse {
  id_komponen_marker: number;
  id_marker_plan: number;
  nama_komponen: string;
  created_at: string;
  ratios: RatioMarkerResponse[];
}

export interface MarkerPlanResponse {
  id_marker_plan: number;
  no_dokumen: string;
  tanggal_efektif: string;
  id_wo_shell: number;
  color: string;
  fabric_description: string;
  style: string;
  model: string;
  qty_fabric_received: number;
  created_at: string;
  components: KomponenMarkerPlanResponse[];
}
