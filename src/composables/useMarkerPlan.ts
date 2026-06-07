import { ref } from 'vue';
import { getMarkerPlanById, createMarkerPlan } from '@/api/marker-plan/marker-plan';
import type { MarkerPlanResponse } from '@/schemas/marker-plan/response';
import type { CreateMarkerPlanRequest } from '@/schemas/marker-plan/request';

export function useMarkerPlan() {
    const isLoading = ref(false);
    const isSaving = ref(false);
    const detail = ref<MarkerPlanResponse | null>(null);

    const fetchDetail = async (id: string | number) => {
        isLoading.value = true;
        try {
            const data = await getMarkerPlanById(id);
            detail.value = data;
            return data;
        } catch (error) {
            console.error("Gagal load marker plan detail:", error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    const saveMarkerPlan = async (payload: CreateMarkerPlanRequest) => {
        isSaving.value = true;
        try {
            const data = await createMarkerPlan(payload);
            return data;
        } catch (error) {
            console.error("Gagal save marker plan:", error);
            throw error;
        } finally {
            isSaving.value = false;
        }
    };

    return {
        isLoading,
        isSaving,
        detail,
        fetchDetail,
        saveMarkerPlan,
    };
}
