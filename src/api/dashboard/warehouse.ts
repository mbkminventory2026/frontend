import { apiClient } from '@/lib/apiClient';

export interface RecentWarehouseSuratJalanClient {
  id_surat_jalan_client: number;
  tanggal: string;
  keterangan: string;
  material_description: string;
}

export interface RecentWarehouseSuratJalanInternal {
  id_surat_jalan_internal: number;
  created_at: string;
}

export interface RecentWarehouseBarang {
  id_barang: number;
  nama_barang: string;
  kode: string;
  stok_minimum: number;
  created_at: string;
}

export interface LowStockAlert {
  id_rekonsiliasi_material: number;
  description: string;
  size: string;
  balance: number;
  last_balance: number;
  satuan: string;
  min_stock: number;
}

export interface WarehouseDashboardMetrics {
  total_items: number;
  total_surat_jalan_client_this_month: number;
  total_surat_jalan_internal_this_month: number;
  low_stock_alerts_count: number;
  recent_surat_jalan_clients: RecentWarehouseSuratJalanClient[] | null;
  recent_surat_jalan_internals: RecentWarehouseSuratJalanInternal[] | null;
  recent_barangs: RecentWarehouseBarang[] | null;
  low_stock_alerts: LowStockAlert[] | null;
}

export const getWarehouseMetrics = async (): Promise<WarehouseDashboardMetrics | null> => {
  try {
    const response = await apiClient.get('/api/v1/dashboard/warehouse');
    return response.data?.data || null;
  } catch (error) {
    console.error('Failed to fetch warehouse metrics:', error);
    return null;
  }
};
