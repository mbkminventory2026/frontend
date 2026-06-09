import { apiClient } from '@/lib/apiClient';

export interface RecentTimeline {
  id_timeline: number;
  tanggal_disusun: string;
  notes: string;
  po_number: string;
}

export interface RecentMarkerPlan {
  id_marker_plan: number;
  no_dokumen: string;
  tanggal_efektif: string;
  color: string;
  model: string;
}

export interface RecentSpreadingCuttingPlan {
  id_spreading_cutting_plan: number;
  no_dokumen: string;
  tanggal_efektif: string;
  model: string;
}

export interface ProductionDashboardMetrics {
  target_produksi_pcs: number;
  total_timeline_this_month: number;
  total_marker_plan_this_month: number;
  total_spreading_cutting_plan_this_month: number;
  recent_timelines: RecentTimeline[] | null;
  recent_marker_plans: RecentMarkerPlan[] | null;
  recent_spreading_cutting_plans: RecentSpreadingCuttingPlan[] | null;
}

export const getProductionMetrics = async (): Promise<ProductionDashboardMetrics | null> => {
  try {
    const response = await apiClient.get('/api/v1/dashboard/production');
    return response.data?.data || null;
  } catch (error) {
    console.error('Failed to fetch production metrics:', error);
    return null;
  }
};
