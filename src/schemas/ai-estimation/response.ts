export interface AIPredictionResponseData {
  estimasi_waktu_total_hari: number;
  estimasi_tahap_cutting_hari: number;
  estimasi_tahap_sewing_hari: number;
  estimasi_tahap_qc_hari: number;
}

export interface AIEstimationSuccessResponse {
  status: string;
  message: string;
  data: AIPredictionResponseData;
}
