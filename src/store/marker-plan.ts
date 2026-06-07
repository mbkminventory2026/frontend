import { defineStore } from "pinia";
import { ref } from "vue";
import type { MarkerPlanResponse } from "@/schemas/marker-plan/response";

export const useMarkerPlanStore = defineStore('marker-plan', () => {
    const currentMarkerPlan = ref<MarkerPlanResponse | null>(null);
    const isLoading = ref(false);

    const setCurrentMarkerPlan = (plan: MarkerPlanResponse | null) => {
        currentMarkerPlan.value = plan;
    };

    const setLoading = (loading: boolean) => {
        isLoading.value = loading;
    };

    return {
        currentMarkerPlan,
        isLoading,
        setCurrentMarkerPlan,
        setLoading,
    };
});
