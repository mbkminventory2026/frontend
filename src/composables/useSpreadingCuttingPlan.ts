import { ref } from 'vue';
import { getSpreadingCuttingPlanById, createSpreadingCuttingPlan } from '@/api/spreading-cutting-plan/spreading-cutting-plan';
import type { SpreadingCuttingPlanResponse } from '@/schemas/spreading-cutting-plan/response';
import type { CreateSpreadingCuttingPlanRequest } from '@/schemas/spreading-cutting-plan/request';

export function useSpreadingCuttingPlan() {
    const isLoading = ref(false);
    const isSaving = ref(false);
    const detail = ref<SpreadingCuttingPlanResponse | null>(null);

    const fetchDetail = async (id: string | number) => {
        isLoading.value = true;
        try {
            const data = await getSpreadingCuttingPlanById(id);
            detail.value = data;
            return data;
        } catch (error) {
            console.error("Gagal load spreading cutting plan detail:", error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    const saveSpreadingPlan = async (payload: CreateSpreadingCuttingPlanRequest) => {
        isSaving.value = true;
        try {
            const data = await createSpreadingCuttingPlan(payload);
            return data;
        } catch (error) {
            console.error("Gagal save spreading plan:", error);
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
        saveSpreadingPlan,
    };
}
